import { expect, test } from '@playwright/test'

const routes = [
  ['/', 'Home'],
  ['/nft/1', 'NFT details'],
  ['/cart', 'Cart'],
  ['/checkout', 'Payment'],
  ['/orders/1', 'Order confirmation'],
  ['/login', 'Login'],
  ['/signup', 'Sign up'],
  ['/profile', 'Profile'],
  ['/wallets', 'Wallets'],
] as const

for (const [path, heading] of routes) {
  test(`renders ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  })
}

test('unknown route shows not found', async ({ page }) => {
  await page.goto('/does-not-exist')
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
})

test('mock service worker is active', async ({ page }) => {
  await page.goto('/')
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL))
    .toContain('mockServiceWorker.js')
})
