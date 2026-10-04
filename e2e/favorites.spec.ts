import { expect, test } from '@playwright/test'
import { cards, reload, signIn, start } from './support'

test('signed-out users are sent to login and back', async ({ page }) => {
  await start(page)
  await page.goto('/')
  await cards(page).first().getByRole('button', { name: 'Favoritar Emerald Ape #042' }).click()
  await expect(page).toHaveURL('/login?redirect=%2F')
})

test('favorite, persist and remove', async ({ page, isMobile }) => {
  await start(page)
  await signIn(page)
  await page.goto('/nft/nft-001')
  // Desktop: the "Favoritar" text button; mobile: the top-bar heart, whose label names the NFT.
  const heart = isMobile
    ? page.getByRole('button', { name: /^(Favoritar|Remover) Emerald Ape #042/ }).first()
    : page.getByRole('button', { name: /^Favorit(ar|ado)$/ })
  await expect(heart).toHaveAttribute('aria-pressed', 'false')
  await heart.click()
  await expect(heart).toHaveAttribute('aria-pressed', 'true')

  await reload(page)
  await expect(heart).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/favorites')
  await expect(page.getByRole('link', { name: 'Emerald Ape #042', exact: true })).toBeVisible()

  // Wait for the removal before reloading: a page load would cancel the request.
  const removed = page.waitForResponse((r) => r.url().endsWith('/api/favorites/nft-001') && r.ok())
  await page.getByRole('button', { name: 'Remover Emerald Ape #042 da lista de interesse' }).click()
  await removed
  await reload(page)
  await expect(page.getByRole('heading', { name: 'Lista de interesse' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Emerald Ape #042', exact: true })).toBeHidden()
})

test('a failed favorite rolls back and explains why', async ({ page }) => {
  await start(page)
  await signIn(page)
  await page.evaluate(() =>
    window.__mock.configure({
      latency: 600,
      failures: [{ match: 'PUT /api/favorites', error: 'TRANSIENT', times: 1 }],
    }),
  )
  await page.goto('/')
  const heart = cards(page)
    .first()
    .getByRole('button', { name: /^(Favoritar|Remover) Emerald Ape #042/ })
  await heart.click()
  // Optimistic: pressed right away, then restored when the API fails.
  await expect(heart).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByText('Não foi possível favoritar Emerald Ape #042. Tente novamente.'),
  ).toBeVisible()
  await expect(heart).toHaveAttribute('aria-pressed', 'false')

  // Recovery: the next attempt succeeds. Wait for it before leaving, a page load would cancel it.
  const saved = page.waitForResponse((r) => r.url().endsWith('/api/favorites/nft-001') && r.ok())
  await heart.click()
  await expect(heart).toHaveAttribute('aria-pressed', 'true')
  await saved
  await page.goto('/favorites')
  await expect(page.getByRole('link', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
})
