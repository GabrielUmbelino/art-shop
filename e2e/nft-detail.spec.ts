import { expect, test } from '@playwright/test'
import { cards, start } from './support'

test('direct access, editions and quantity limit', async ({ page, isMobile }) => {
  await start(page)
  await page.goto('/nft/nft-001')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByRole('radio', { name: '1/50' })).toBeChecked()
  await expect(page.getByText('47 de 50 disponíveis')).toBeVisible()

  const stepper = page.getByRole('group', { name: 'Quantidade' }).filter({ visible: true })
  const plus = stepper.getByRole('button', { name: 'Aumentar quantidade' })
  for (let i = 1; i < 10; i++) await plus.click()
  await expect(stepper.locator('output')).toHaveText('10')
  await expect(plus).toBeDisabled()

  // The 1/1 edition has a single unit.
  await page.getByText('1/1', { exact: true }).click()
  await expect(page).toHaveURL(/edition=nft-001-e1/)
  await expect(stepper.locator('output')).toHaveText('1')
  await expect(plus).toBeDisabled()

  if (!isMobile) {
    await page.getByRole('tab', { name: /Avaliações de colecionadores \(19\)/ }).click()
    await expect(page.getByRole('tabpanel').getByRole('listitem')).toHaveCount(19)
  }
})

test('unavailable edition and non-existent NFT', async ({ page }) => {
  await start(page)
  await page.goto('/nft/nft-005?edition=nft-005-e10')
  await expect(page.getByRole('radio', { name: /1\/10/ })).toBeDisabled()
  await expect(page.getByRole('alert')).toHaveText(
    'A edição 1/10 está esgotada. Escolha outra edição.',
  )
  for (const button of await page.getByRole('button', { name: /Comprar/ }).all())
    await expect(button).toBeDisabled()

  await page.goto('/nft/nao-existe')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
})

test('opens the details from a catalog card', async ({ page }) => {
  await start(page)
  await page.goto('/')
  await cards(page).first().getByRole('link', { name: 'Emerald Ape #042', exact: true }).click()
  await expect(page).toHaveURL('/nft/nft-001')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Emerald Ape #042')
})
