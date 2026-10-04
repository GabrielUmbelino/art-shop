import { expect, test, type Page } from '@playwright/test'
import { signIn, start } from './support'

/** 320px is a 1280px screen at 400% zoom (WCAG reflow); 390, 768 and 1440 are the spec's sizes. */
const widths = [320, 390, 768, 1440]
const publicRoutes = ['/', '/nft/nft-001', '/login', '/signup', '/nao-existe']
const privateRoutes = ['/cart', '/checkout', '/profile', '/wallets', '/favorites']

async function expectNoHorizontalOverflow(page: Page, route: string, width: number) {
  await page.goto(route)
  await page.waitForLoadState('networkidle')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow, `${route} at ${width}px overflows by ${overflow}px`).toBeLessThanOrEqual(0)
}

for (const width of widths) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })

    test('public pages do not overflow horizontally', async ({ page }) => {
      await start(page)
      for (const route of publicRoutes) await expectNoHorizontalOverflow(page, route, width)
    })

    test('signed-in pages do not overflow horizontally', async ({ page }) => {
      await start(page)
      await signIn(page)
      await page.goto('/nft/nft-001')
      await page
        .getByRole('button', { name: /^Comprar/ })
        .filter({ visible: true })
        .click()
      await expect(page).toHaveURL('/cart')
      for (const route of privateRoutes) await expectNoHorizontalOverflow(page, route, width)
    })
  })
}
