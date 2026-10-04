import { expect, test, type Page } from '@playwright/test'
import { start } from './support'

const focused = (page: Page) => page.locator('*:focus')

/** Presses Tab until the focused element matches, failing after `max` presses. */
async function tabTo(page: Page, name: RegExp | string, max = 40) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      return el ? (el.getAttribute('aria-label') ?? el.textContent ?? '').trim() : ''
    })
    if (typeof name === 'string' ? label === name : name.test(label)) return
  }
  throw new Error(`Could not reach "${name}" with Tab`)
}

test('skip link, visible focus and keyboard search', async ({ page, isMobile }) => {
  await start(page)
  await page.goto('/')
  // The app renders after the mocks start; wait for it before pressing keys.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(focused(page)).toHaveText('Pular para o conteúdo')
  await expect(focused(page)).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()

  if (isMobile) return
  // From the top of the page: skip link, logo, navigation, then the header search.
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await tabTo(page, 'Buscar NFTs')
  // Visible focus indicator.
  expect(await focused(page).evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toBeFocused()
  await page.keyboard.type('emerald')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/q=emerald/)
})

test('catalog filters and cards work with the keyboard', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop sidebar; the mobile sheet is covered below')
  await start(page)
  await page.goto('/')
  // Wait for the catalog (filters with counts and cards) before tabbing through it.
  await expect(page.locator('#mercado ul > li article')).toHaveCount(9)
  await expect(page.getByRole('button', { name: /^Música \(\d+\)/ })).toBeVisible()
  await tabTo(page, /^Música/)
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(/category=.*music/)
  await expect(page.getByRole('button', { name: /^Música/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.goto('/')
  await expect(page.locator('#mercado ul > li article')).toHaveCount(9)
  await tabTo(page, 'Emerald Ape #042')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/nft/nft-001')
})

test('login dialog traps focus and closes with Escape', async ({ page }) => {
  await start(page)
  await page.goto('/login')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL('/')
})

test('zoom dialog returns focus to its trigger', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Zoom is a desktop control')
  await start(page)
  await page.goto('/nft/nft-001')
  const trigger = page.getByRole('button', { name: 'Ampliar imagem' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})

test('mobile filter sheet traps focus and returns it', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The filter sheet is mobile only')
  await start(page)
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Filtros' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const sheet = page.getByRole('dialog', { name: 'Filtros' })
  await expect(sheet).toBeVisible()
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab')
    expect(await sheet.evaluate((d) => d.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('form errors are announced, linked and focused', async ({ page }) => {
  await start(page)
  await page.goto('/signup')
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: /Criar (conta|perfil)/ }).click()

  const username = dialog.getByLabel('Nome de usuário')
  await expect(username).toBeFocused()
  await expect(username).toHaveAttribute('aria-invalid', 'true')
  const describedBy = await username.getAttribute('aria-describedby')
  expect(describedBy).toBeTruthy()
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText(
    'Use de 3 a 20 letras minúsculas, números ou _',
  )
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveAttribute('role', 'alert')
})
