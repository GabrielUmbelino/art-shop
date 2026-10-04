import { expect, test, type Page } from '@playwright/test'
import { signIn, start } from './support'

/** Loads lazy images (by scrolling through the page) and waits for images and fonts before a screenshot. */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 50))
    }
    window.scrollTo(0, 0)
    // Images scrolled away horizontally (carousels) never load; they are clipped out of the shot anyway.
    const images = Promise.all(
      [...document.images].map((img) => (img.complete ? null : img.decode().catch(() => null))),
    )
    await Promise.race([images, new Promise((r) => setTimeout(r, 3000))])
    await document.fonts.ready
  })
  await page.waitForLoadState('networkidle')
}

async function addToCart(page: Page, nftId: string, quantity: number) {
  await page.goto(`/nft/${nftId}`)
  const stepper = page.getByRole('group', { name: 'Quantidade' }).filter({ visible: true })
  for (let i = 1; i < quantity; i++)
    await stepper.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page
    .getByRole('button', { name: /^Comprar/ })
    .filter({ visible: true })
    .click()
  await expect(page).toHaveURL('/cart')
}

test('home', async ({ page }) => {
  await start(page)
  await page.goto('/')
  await expect(page.locator('#mercado ul > li article')).toHaveCount(9)
  await settle(page)
  await expect(page).toHaveScreenshot('home.png', { fullPage: true })
})

test('nft detail', async ({ page }) => {
  await start(page)
  await page.goto('/nft/nft-001')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Emerald Ape #042')
  await settle(page)
  await expect(page).toHaveScreenshot('detail.png', { fullPage: true })
})

test('cart', async ({ page }) => {
  await start(page)
  // The three items of the cart design: 2, 6 and 9 units (26.846 ETH).
  await addToCart(page, 'nft-001', 2)
  await addToCart(page, 'nft-005', 6)
  await addToCart(page, 'nft-006', 9)
  await expect(page.getByText('26.846 ETH')).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('cart.png', { fullPage: true })
})

test('checkout', async ({ page }) => {
  await start(page)
  await signIn(page)
  await addToCart(page, 'nft-001', 2)
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await expect(page.getByText('2.396 ETH').filter({ visible: true }).first()).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('checkout.png', { fullPage: true })
})
