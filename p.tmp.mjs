import { chromium } from '@playwright/test'
const base = process.env.BASE ?? 'http://localhost:4173'
const browser = await chromium.launch()
const context = await browser.newContext()
await context.addInitScript(() => localStorage.setItem('nft-mock:panel', 'hidden'))
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const h1 = () => page.getByRole('heading', { level: 1 }).first().textContent({ timeout: 8000 }).catch(() => '(no h1)')
await page.goto(base + '/?scenario=fast'); await page.waitForFunction(() => window.__mock !== undefined)
const token = await page.evaluate(async () => (await (await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'ana@example.com', password: 'Collector123' }) })).json()).token)
await page.evaluate((t) => localStorage.setItem('kurio:token', t), token)
for (const path of ['/', '/nft/nft-001', '/cart', '/checkout', '/profile', '/wallets', '/favorites', '/login', '/signup', '/orders/order-999', '/nao-existe']) {
  const res = await page.goto(base + path)
  const first = await h1()
  await page.reload()
  const second = await h1()
  console.log(`${String(res.status()).padEnd(4)} ${path.padEnd(18)} direct: ${first.slice(0, 32).padEnd(32)} | refresh: ${second.slice(0, 32)}`)
}
// Realtime in the production bundle: a price change reaches the open cart.
await page.goto(base + '/nft/nft-001'); await page.getByRole('button', { name: /^Comprar/ }).filter({ visible: true }).click(); await page.waitForURL('**/cart')
await page.evaluate(() => window.__mock.updateEdition('nft-001', 'nft-001-e50', { price: '1.31' }))
const notice = await page.getByRole('list', { name: 'Alterações no carrinho' }).isVisible({ timeout: 5000 }).catch(() => false)
await page.waitForTimeout(1500)
console.log('realtime notice in cart:', notice || (await page.getByRole('list', { name: 'Alterações no carrinho' }).isVisible()), '| page errors:', errors.length ? errors : 'none')
await browser.close()
