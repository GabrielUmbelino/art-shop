import { expect, test, type Page } from '@playwright/test'
import type { ScenarioName } from '../src/mocks/scenarios'
import { reload, signIn, start } from './support'

async function prepare(page: Page, scenario: ScenarioName = 'fast') {
  await start(page, scenario)
  await page.evaluate(() => window.__mock.configure({ latency: 0 }))
  await signIn(page)
  await page.goto('/nft/nft-001')
  await page
    .getByRole('group', { name: 'Quantidade' })
    .filter({ visible: true })
    .getByRole('button', { name: 'Aumentar quantidade' })
    .click()
  await page
    .getByRole('button', { name: /^Comprar/ })
    .filter({ visible: true })
    .click()
  await expect(page).toHaveURL('/cart')
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
}

async function fillAndConnect(page: Page) {
  await page.getByLabel('Código de indicação').fill('KURIO1')
  await page.getByLabel('Nome ENS').fill('ana')
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Conectada via MetaMask na Ethereum')).toBeVisible()
}

const review = (page: Page) => page.getByRole('dialog', { name: 'Revisar pedido' })

async function openReview(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(review(page).getByText('2.396 ETH').last()).toBeVisible()
}

test('full purchase from cart to confirmed receipt', async ({ page }) => {
  await prepare(page)

  // Prefilled from Ana's primary wallet profile.
  await expect(page.getByLabel('Código de indicação')).toHaveValue('KURIO2026')
  await expect(page.getByLabel('Nome do perfil')).toHaveValue('Ana Coleções')

  // Layout validation and the connection requirement.
  await page.getByLabel('Código de indicação').fill('x')
  await page.getByLabel('Nome ENS').fill('')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText('Use de 4 a 12 letras ou números')).toBeVisible()
  await expect(page.getByText('Use um nome ENS válido, como nome.eth')).toBeVisible()
  await page.getByLabel('Código de indicação').fill('KURIO1')
  await page.getByLabel('Nome ENS').fill('ana')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(
    page.getByText('Conecte sua carteira na rede selecionada para continuar.'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await openReview(page)
  await expect(review(page).getByText('ana.eth')).toBeVisible()
  await review(page).getByRole('button', { name: 'Confirmar e pagar' }).click()

  await expect(page).toHaveURL(/\/orders\/order-\d+/)
  await expect(
    page.getByRole('heading', { name: 'Aguardando a confirmação do pagamento' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('row').filter({ hasText: 'Emerald Ape #042' })).toContainText('(x 2)')
  await expect(page.getByText('2.396 ETH').first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute(
    'href',
    /^https:\/\/etherscan\.io\/tx\/0x/,
  )

  // Only the bought units left the cart.
  await page.goto('/cart')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('refused payment keeps the cart', async ({ page }) => {
  await prepare(page, 'payment-refused')
  await fillAndConnect(page)
  await openReview(page)
  await review(page).getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('link', { name: 'Ver carrinho' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Emerald Ape #042' })).toBeVisible()
})

test('repeated clicks create a single order', async ({ page }) => {
  await prepare(page)
  await page.evaluate(() => window.__mock.configure({ latency: 400, orderOutcome: 'manual' }))
  await fillAndConnect(page)
  await openReview(page)
  await review(page).getByRole('button', { name: 'Confirmar e pagar' }).dblclick()
  await review(page)
    .getByRole('button', { name: /Processando|Confirmar e pagar/ })
    .click({ force: true })
    .catch(() => undefined)
  await expect(page).toHaveURL(/\/orders\//)
  expect(await page.evaluate(() => window.__mock.state().orders.length)).toBe(1)
})

test('timeout after creation recovers the same order', async ({ page }) => {
  await prepare(page, 'order-timeout')
  await page.evaluate(() => window.__mock.configure({ latency: 0, orderOutcome: 'manual' }))
  await fillAndConnect(page)
  await openReview(page)
  // Some latency keeps the retry (and its message) on screen long enough to observe.
  await page.evaluate(() => window.__mock.configure({ latency: 800 }))
  await review(page).getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(review(page).getByText(/Recuperando seu pedido sem criar outra compra/)).toBeVisible(
    { timeout: 10_000 },
  )
  await expect(page).toHaveURL(/\/orders\//, { timeout: 15_000 })
  expect(await page.evaluate(() => window.__mock.state().orders.length)).toBe(1)
})

test('realtime price change during review requires a new confirmation', async ({ page }) => {
  await prepare(page)
  await fillAndConnect(page)
  await openReview(page)

  await page.evaluate(() =>
    window.__mock.updateEdition('nft-001', 'nft-001-e50', { price: '1.31' }),
  )
  await expect(review(page).getByText(/Os valores do seu pedido mudaram/)).toBeVisible()
  await review(page).getByRole('button', { name: 'Confirmar novos valores' }).click()
  await expect(
    review(page).getByText(
      'Os valores mudaram: o total foi de 2.396 ETH para 2.636 ETH. Confirme os novos valores para continuar.',
    ),
  ).toBeVisible()
  expect(await page.evaluate(() => window.__mock.state().orders.length)).toBe(0)

  await review(page).getByRole('button', { name: 'Confirmar novos valores' }).click()
  await expect(page).toHaveURL(/\/orders\//)
  expect(await page.evaluate(() => window.__mock.state().orders[0].total)).toBe('2.636')
})

test('price change detected by the API at submission', async ({ page }) => {
  await prepare(page, 'price-change')
  await page.evaluate(() => window.__mock.configure({ latency: 0 }))
  await fillAndConnect(page)
  await openReview(page)
  await review(page).getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(
    review(page).getByText(/Os valores mudaram: o total foi de 2.396 ETH para 2.634 ETH/),
  ).toBeVisible()
  await review(page).getByRole('button', { name: 'Confirmar novos valores' }).click()
  await expect(page).toHaveURL(/\/orders\//)
})

test('pending order survives refresh and a lost connection', async ({ page }) => {
  await prepare(page)
  await page.evaluate(() => window.__mock.configure({ orderOutcome: 'manual' }))
  await fillAndConnect(page)
  await openReview(page)
  await review(page).getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(
    page.getByRole('heading', { name: 'Aguardando a confirmação do pagamento' }),
  ).toBeVisible()
  const url = page.url()

  await reload(page)
  await expect(page).toHaveURL(url)
  await expect(
    page.getByRole('heading', { name: 'Aguardando a confirmação do pagamento' }),
  ).toBeVisible()

  // The confirmation happens while the socket is down: the event is lost, reconnection reconciles.
  await page.evaluate(() => window.__mock.configure({ socketOffline: true }))
  const orderId = url.split('/').pop()!
  await page.evaluate((id) => window.__mock.resolveOrder(id, 'confirmed'), orderId)
  await page.waitForTimeout(500)
  await expect(
    page.getByRole('heading', { name: 'Aguardando a confirmação do pagamento' }),
  ).toBeVisible()
  await page.evaluate(() => window.__mock.configure({ socketOffline: false }))
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible({ timeout: 15_000 })
  expect(await page.evaluate(() => window.__mock.state().orders.length)).toBe(1)
})

test('duplicate and stale events never regress newer data', async ({ page }) => {
  await start(page)
  await page.goto('/nft/nft-001?edition=nft-001-e50')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Emerald Ape #042')
  await page.evaluate(() =>
    window.__mock.updateEdition('nft-001', 'nft-001-e50', { price: '1.31' }),
  )
  await page.evaluate(() =>
    window.__mock.updateEdition('nft-001', 'nft-001-e50', { price: '1.41' }),
  )
  const price = page.locator('main').getByText('1.41 ETH').filter({ visible: true }).first()
  await expect(price).toBeVisible()

  // Replaying the older event (version 2) and the latest one again changes nothing.
  await page.evaluate(() => {
    const events = window.__mock.events()
    window.__mock.replay(events[0].id)
    window.__mock.replay(events[1].id)
  })
  await page.waitForTimeout(500)
  await expect(price).toBeVisible()
  await expect(page.locator('main').getByText('1.31 ETH')).toHaveCount(0)
})

test('wallet connection rejected, then disconnected', async ({ page }) => {
  await prepare(page, 'wallet-rejected')
  await page.evaluate(() => window.__mock.configure({ latency: 0 }))
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'A carteira recusou a conexão' }),
  ).toBeVisible()

  await page.evaluate(() => window.__mock.configure({ walletRejects: false }))
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Conectada via MetaMask na Ethereum')).toBeVisible()
  await page.getByRole('button', { name: 'Desconectar' }).click()
  await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeVisible()
})
