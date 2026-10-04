import { expect, test } from '@playwright/test'
import { start } from './support'

const publicRoutes = [
  ['/', /Seja dono d[ao] (futuro da arte|cultura) digital/],
  ['/nft/nft-001', 'Emerald Ape #042'],
  ['/cart', /^Carrinho/],
] as const

const privateRoutes = ['/checkout', '/orders/1', '/profile', '/wallets', '/favorites']

for (const [path, heading] of publicRoutes) {
  test(`renders ${path}`, async ({ page }) => {
    await start(page)
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    // No horizontal overflow at any viewport (spec §8).
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth),
    )
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
