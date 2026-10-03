import { expect, test } from '@playwright/test'
import { start } from './support'

const publicRoutes = [
  ['/', 'Seja dono do futuro da arte digital'],
  ['/nft/1', 'NFT details'],
  ['/cart', 'Cart'],
] as const

const privateRoutes = ['/checkout', '/orders/1', '/profile', '/wallets', '/favorites']

for (const [path, heading] of publicRoutes) {
  test(`renders ${path}`, async ({ page }) => {
    await start(page)
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  })
}

for (const path of privateRoutes) {
  test(`${path} requires a session`, async ({ page }) => {
    await start(page)
    await page.goto(path)
    await expect(page).toHaveURL(`/login?redirect=${encodeURIComponent(path)}`)
    await expect(page.getByRole('dialog')).toBeVisible()
  })
}

test('unknown route shows not found', async ({ page }) => {
  await start(page)
  await page.goto('/does-not-exist')
  await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible()
})

test('mock service worker is active', async ({ page }) => {
  await page.goto('/')
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL))
    .toContain('mockServiceWorker.js')
})
