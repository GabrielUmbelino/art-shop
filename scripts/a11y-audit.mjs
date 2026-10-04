/**
 * Accessibility audit with axe-core (WCAG 2.1 A/AA + best practices) on every screen, desktop and mobile.
 * axe-core is not a direct dependency: the copy installed with Lighthouse is used.
 * Usage: pnpm dev (in another terminal), then pnpm a11y. Exits with 1 when a rule is violated.
 */
import { chromium } from '@playwright/test'
import { globSync } from 'node:fs'

const AXE = globSync('node_modules/.pnpm/axe-core@*/node_modules/axe-core/axe.min.js')[0]
if (!AXE) throw new Error('axe-core not found (installed with @lhci/cli): run pnpm install')
const base = process.env.BASE_URL ?? 'http://localhost:5173'
const browser = await chromium.launch()
const results = new Map()

async function audit(page, label) {
  await page.waitForTimeout(700)
  await page.addScriptTag({ path: AXE })
  const violations = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
    })
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      n: v.nodes.length,
      target: v.nodes[0]?.target.join(' '),
      html: v.nodes[0]?.html.slice(0, 140),
    }))
  })
  for (const v of violations) {
    const key = `${v.id} | ${v.impact} | ${v.help}`
    if (!results.has(key)) results.set(key, [])
    results.get(key).push(`${label} (${v.n}) ${v.target} :: ${v.html}`)
  }
}

for (const [vp, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  const context = await browser.newContext({ viewport })
  await context.addInitScript(() => localStorage.setItem('nft-mock:panel', 'hidden'))
  const page = await context.newPage()
  await page.goto(base + '/?scenario=fast')
  await page.waitForFunction(() => window.__mock !== undefined)
  await page.evaluate(() => {
    window.__mock.reset('fast')
    window.__mock.configure({ orderDelayMs: 100 })
  })
  for (const path of [
    '/',
    '/nft/nft-001',
    '/nft/nft-005?edition=nft-005-e10',
    '/login',
    '/signup',
    '/nao-existe',
  ]) {
    await page.goto(base + path)
    await audit(page, `${vp} ${path}`)
  }
  await page.goto(base + '/nft/nft-001')
  await page
    .getByRole('button', { name: /^Comprar/ })
    .filter({ visible: true })
    .click()
  await page.waitForURL('**/cart')
  await audit(page, `${vp} /cart`)
  const token = await page.evaluate(
    async () =>
      (
        await (
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'ana@example.com', password: 'Collector123' }),
          })
        ).json()
      ).token,
  )
  await page.evaluate((t) => localStorage.setItem('kurio:token', t), token)
  for (const path of ['/profile', '/wallets', '/favorites']) {
    await page.goto(base + path)
    await audit(page, `${vp} ${path}`)
  }
  await page.goto(base + '/nft/nft-002')
  await page
    .getByRole('button', { name: /^Comprar/ })
    .filter({ visible: true })
    .click()
  await page.waitForURL('**/cart')
  await page.goto(base + '/checkout')
  await page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()
  await audit(page, `${vp} /checkout`)
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await page.getByText('Conectada via').waitFor()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar e pagar' }).waitFor()
  await audit(page, `${vp} review dialog`)
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar e pagar' }).click()
  await page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }).waitFor()
  await audit(page, `${vp} receipt`)
  await context.close()
}
await browser.close()
for (const [key, where] of results) {
  console.log('\n## ' + key)
  for (const w of where.slice(0, 4)) console.log('   - ' + w)
  if (where.length > 4) console.log(`   ... +${where.length - 4} more pages`)
}
console.log('\nTOTAL rule violations:', results.size)
process.exit(results.size ? 1 : 0)
