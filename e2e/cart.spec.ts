import { expect, test, type Page } from '@playwright/test'
import { cards, reload, start } from './support'

/** Adds an NFT from its page with the given quantity (default edition 1/50 unless `edition`). */
async function buy(page: Page, nftId: string, quantity = 1, edition?: string) {
  await page.goto(`/nft/${nftId}${edition ? `?edition=${edition}` : ''}`)
  const stepper = page.getByRole('group', { name: 'Quantidade' }).filter({ visible: true })
  for (let i = 1; i < quantity; i++)
    await stepper.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page
    .getByRole('button', { name: /^Comprar/ })
    .filter({ visible: true })
    .click()
  await expect(page).toHaveURL('/cart')
}

const summaryValue = (page: Page, label: string) =>
  page
    .locator('dl > div', { has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) })
    .locator('dd')

const row = (page: Page, name: string) => page.getByRole('row').filter({ hasText: name })

test('quantities, limits, removal and empty cart', async ({ page }) => {
  await start(page)
  await buy(page, 'nft-001', 2)
  await expect(row(page, 'Emerald Ape #042')).toBeVisible()
  await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')
  await expect(summaryValue(page, 'Taxa de rede')).toHaveText(/^0\.016 ETH/)
  await expect(summaryValue(page, 'Total')).toHaveText('2.396 ETH')

  const stepper = page.getByRole('group', { name: 'Quantidade de Emerald Ape #042' }).first()
  await stepper.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(summaryValue(page, 'Subtotal')).toHaveText('3.57 ETH')
  await stepper.getByRole('button', { name: 'Diminuir quantidade' }).click()
  await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')

  // The 1/1 edition has a single unit: the cart cannot go above it.
  await buy(page, 'nft-001', 1, 'nft-001-e1')
  const unique = page.getByRole('group', { name: 'Quantidade de Emerald Ape #042' }).nth(1)
  await expect(unique.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()

  for (const button of await page
    .getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' })
    .all()) {
    await page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }).first().click()
    void button
  }
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('coupons: invalid, expired, applied and removed', async ({ page }) => {
  await start(page)
  await buy(page, 'nft-001', 2)
  const input = page.getByRole('textbox', { name: 'Código promocional' })
  const apply = page.getByRole('button', { name: 'Aplicar' })

  await input.fill('NOPE')
  await apply.click()
  await expect(page.getByText('Este código promocional não existe')).toBeVisible()
  await expect(input).toHaveAttribute('aria-invalid', 'true')

  await input.fill('summer20')
  await apply.click()
  await expect(page.getByText('Este código promocional expirou')).toBeVisible()

  await input.fill('welcome10')
  await apply.click()
  await expect(page.getByText(/Cupom WELCOME10 aplicado/)).toBeVisible()
  await expect(summaryValue(page, 'Desconto do lançamento')).toHaveText('(-) 0.238 ETH')
  await expect(summaryValue(page, 'Total')).toHaveText('2.158 ETH')

  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expect(summaryValue(page, 'Total')).toHaveText('2.396 ETH')
})

test('guest cart survives refresh and is kept after login', async ({ page }) => {
  await start(page)
  await buy(page, 'nft-005', 3)
  await reload(page)
  await expect(row(page, 'Violet Nomad #314')).toBeVisible()

  // Checkout requires a session; logging in merges the guest cart into Ana's.
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/login?redirect=%2Fcheckout')
  await page.getByRole('dialog').getByLabel('E-mail').fill('ana@example.com')
  await page.getByRole('dialog').getByLabel('Senha', { exact: true }).fill('Collector123')
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/checkout')
  await page.goto('/cart')
  await expect(row(page, 'Violet Nomad #314')).toBeVisible()
  await expect(
    page.getByRole('group', { name: 'Quantidade de Violet Nomad #314' }).locator('output'),
  ).toHaveText('3')

  // After logout the user's cart is no longer shown.
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/cart')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('realtime price and availability changes update the cart', async ({ page }) => {
  await start(page)
  await buy(page, 'nft-001', 2)
  await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')

  await page.evaluate(() =>
    window.__mock.updateEdition('nft-001', 'nft-001-e50', { price: '1.31' }),
  )
  const notice = 'O preço de Emerald Ape #042 (1/50) mudou de 1.19 ETH para 1.31 ETH.'
  await expect(
    page.getByRole('list', { name: 'Alterações no carrinho' }).getByText(notice),
  ).toBeVisible()
  await expect(summaryValue(page, 'Subtotal')).toHaveText('2.62 ETH')

  // A duplicate delivery of the same event changes nothing.
  await page.evaluate(() => window.__mock.replay(window.__mock.events().at(-1)!.id))
  await page.waitForTimeout(300)
  await expect(
    page.getByRole('list', { name: 'Alterações no carrinho' }).getByRole('listitem'),
  ).toHaveCount(1)

  await page.evaluate(() => window.__mock.updateEdition('nft-001', 'nft-001-e50', { available: 0 }))
  await expect(
    page
      .getByRole('list', { name: 'Alterações no carrinho' })
      .getByText('Emerald Ape #042 (1/50) esgotou.'),
  ).toBeVisible()
  await expect(
    row(page, 'Emerald Ape #042').getByText('Esgotado. Remova este item para continuar.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()
})

test('quick add from a catalog card updates the cart badge', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The card cart action is desktop only (hover actions)')
  await start(page)
  await page.goto('/')
  const card = cards(page).first()
  await card.hover()
  await card.getByRole('button', { name: 'Adicionar Emerald Ape #042 ao carrinho' }).click()
  await expect(page.getByText('Emerald Ape #042 adicionado ao carrinho')).toBeVisible()
  await expect(
    page.getByRole('banner').getByRole('link', { name: /Carrinho.*1 item/ }),
  ).toBeVisible()
})
