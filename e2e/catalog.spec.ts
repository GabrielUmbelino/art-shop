import { expect, test } from '@playwright/test'
import { api, cards, filters, resultCount, start } from './support'

type List = { total: number; items: { name: string }[] }

test('search, combined filters, sort, pagination and history', async ({ page, isMobile }) => {
  await start(page)
  await page.goto('/')
  await expect(cards(page)).toHaveCount(9)
  expect(await resultCount(page)).toBe(48)

  // Pagination
  await page.getByRole('button', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  // Combined filters reset the page and match the API for the same parameters
  let panel = await filters(page, isMobile)
  await panel.getByRole('button', { name: /^Música/ }).click()
  await panel.getByRole('button', { name: /^Ethereum/ }).click()
  if (isMobile) await page.keyboard.press('Escape')
  await expect(page).not.toHaveURL(/page=/)
  await expect(page).toHaveURL(/category=.*music/)
  await expect(page).toHaveURL(/network=.*ethereum/)
  const expected = await api<List>(page, 'GET', '/api/nfts?category=music&network=ethereum')
  await expect.poll(() => resultCount(page)).toBe(expected.body.total)

  // Sort
  if (!isMobile) {
    await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    await expect(page).toHaveURL(/sort=price-asc/)
    const prices = await cards(page).locator('p span:first-child').allTextContents()
    const values = prices.map((p) => Number(p.replace(' ETH', '')))
    expect(values).toEqual([...values].sort((a, b) => a - b))
  }

  // Back restores the previous states, refresh keeps the current one
  const url = page.url()
  await page.reload()
  await expect(page).toHaveURL(url)
  await expect.poll(() => resultCount(page)).toBe(expected.body.total)
  await page.goBack()
  if (!isMobile) await page.goBack()
  await expect(page).toHaveURL(/category=.*music/)
  await expect(page).not.toHaveURL(/network=/)
  await page.goBack()
  await expect(page).toHaveURL(/page=2/)

  // Clearing filters
  panel = await filters(page, isMobile)
  if (isMobile) await page.keyboard.press('Escape')
  await page.goto('/?category=%5B%22music%22%5D')
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect.poll(() => resultCount(page)).toBe(48)
})

test('search by text, tabs and empty result', async ({ page, isMobile }) => {
  await start(page)
  await page.goto('/')
  if (isMobile) {
    await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill('emerald')
  } else {
    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill('emerald')
    await page.keyboard.press('Enter')
  }
  await expect(page).toHaveURL(/q=emerald/)
  const emerald = await api<List>(page, 'GET', '/api/nfts?q=emerald')
  await expect.poll(() => resultCount(page)).toBe(emerald.body.total)
  for (const name of await cards(page).locator('h3').allTextContents())
    expect(name).toMatch(/Emerald/)

  await page.getByRole('button', { name: 'Novos lançamentos' }).click()
  await expect(page).toHaveURL(/tab=new/)
  await expect(page.getByRole('button', { name: 'Novos lançamentos' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.goto('/?q=nada-por-aqui')
  await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()
})

test('out-of-order responses never replace newer results', async ({ page, isMobile }) => {
  await start(page, 'out-of-order')
  await page.goto('/')
  await expect(cards(page)).toHaveCount(9)
  const panel = await filters(page, isMobile)
  // The first of these requests is slow (1.5 s) and the second fast; the UI must keep the second.
  await panel.getByRole('button', { name: /^Música/ }).click()
  await panel.getByRole('button', { name: /^Jogos/ }).click()
  if (isMobile) await page.keyboard.press('Escape')
  const expected = await api<List>(page, 'GET', '/api/nfts?category=music&category=gaming')
  await page.waitForTimeout(2_000)
  expect(await resultCount(page)).toBe(expected.body.total)
})

test('skeletons while loading, error feedback and retry', async ({ page }) => {
  await start(page, 'slow')
  await page.goto('/')
  await expect(page.locator('#mercado ul [data-slot="skeleton"]').first()).toBeVisible()
  await expect(cards(page)).toHaveCount(9, { timeout: 10_000 })

  await page.evaluate(() =>
    window.__mock.configure({
      latency: 0,
      failures: [{ match: 'GET /api/nfts', error: 'TRANSIENT' }],
    }),
  )
  await page.goto('/?page=3')
  // The request and its two automatic retries fail, then the error is shown.
  const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar o catálogo.' })
  await expect(alert).toBeVisible({ timeout: 10_000 })
  await page.evaluate(() => window.__mock.configure({ failures: [] }))
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(cards(page)).toHaveCount(9)
})
