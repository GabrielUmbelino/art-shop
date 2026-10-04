import { expect, test } from '@playwright/test'
import { api, reload, signIn, start } from './support'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

test('profile data: validation, conflict and persistence', async ({ page }) => {
  await start(page)
  await signIn(page)
  await page.goto('/profile')
  const save = page.getByRole('button', { name: 'Salvar', exact: true })

  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('ana@')
  await page.getByLabel('Nome ENS').fill('')
  await save.click()
  await expect(page.getByText('Informe um e-mail válido')).toBeVisible()
  await expect(page.getByText('Use um nome ENS válido, como nome.eth')).toBeVisible()

  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('ana@example.com')
  await page.getByLabel('Nome ENS').fill('ana')
  await page.getByLabel('Nome de usuário').fill('bruno')
  await save.click()
  await expect(page.getByText('Este nome de usuário já está em uso')).toBeVisible()
  await expect(page.getByLabel('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')

  await page.getByLabel('Nome de usuário').fill('ana')
  await page.getByLabel('Nome de exibição').fill('Ana S.')
  await page.getByLabel('Apelido da carteira').fill('Cofre da Ana')
  await save.click()
  await expect(page.getByText('Perfil atualizado.')).toBeVisible()

  await reload(page)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana S.')
  await expect(page.getByLabel('Apelido da carteira')).toHaveValue('Cofre da Ana')
})

test('avatar: type check, upload, persistence and removal', async ({ page }) => {
  await start(page)
  await signIn(page)
  await page.goto('/profile')
  const file = page.getByLabel('Escolher imagem do avatar')

  await file.setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello'),
  })
  await expect(page.getByText('Use uma imagem PNG, JPEG, WebP ou GIF')).toBeVisible()

  await file.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Perfil atualizado.')).toBeVisible()

  await reload(page)
  await expect(page.getByRole('img', { name: 'Seu avatar' })).toHaveAttribute(
    'src',
    /^data:image\/png;base64,/,
  )

  await page.getByRole('button', { name: 'Remover', exact: true }).click()
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Perfil atualizado.')).toBeVisible()
  await reload(page)
  await expect(page.getByRole('img', { name: 'Seu avatar' })).toHaveCount(0)
})

test('password change: errors and success', async ({ page }) => {
  await start(page)
  await signIn(page)
  await page.goto('/profile')
  const save = page.getByRole('button', { name: 'Salvar', exact: true })
  const current = page.getByLabel('Senha atual', { exact: true })
  const next = page.getByLabel('Nova senha', { exact: true })
  const confirm = page.getByLabel('Confirmar nova senha', { exact: true })

  await next.fill('curta')
  await confirm.fill('outra')
  await save.click()
  await expect(page.getByText('Informe sua senha atual')).toBeVisible()
  await expect(page.getByText('Use pelo menos 8 caracteres')).toBeVisible()
  await expect(page.getByText('As senhas não coincidem')).toBeVisible()

  await current.fill('errada123')
  await next.fill('NovaSenha123')
  await confirm.fill('NovaSenha123')
  await save.click()
  await expect(page.getByText('Senha atual incorreta')).toBeVisible()

  await current.fill('Collector123')
  await save.click()
  await expect(page.getByText('Perfil e senha atualizados.')).toBeVisible()
  await expect(current).toHaveValue('')

  const withNew = await api(page, 'POST', '/api/auth/login', {
    body: { email: 'ana@example.com', password: 'NovaSenha123' },
  })
  expect(withNew.status).toBe(200)
  const withOld = await api(page, 'POST', '/api/auth/login', {
    body: { email: 'ana@example.com', password: 'Collector123' },
  })
  expect(withOld.status).toBe(422)
})

test('wallets: add a secondary wallet and edit the primary', async ({ page }) => {
  await start(page)
  await signIn(page)
  await page.goto('/wallets')
  const primary = page.getByRole('form', { name: 'Carteira principal' })
  await expect(primary.getByLabel('Apelido da carteira')).toHaveValue('Principal')
  await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar' }).click()
  const secondary = page.getByRole('form', { name: 'Carteira secundária' })
  await secondary.getByLabel('Igual à carteira principal').check()
  await expect(secondary.getByLabel('Nome de exibição')).toHaveValue('Ana Souza')
  await expect(secondary.getByLabel('Código de indicação')).toHaveValue('KURIO2026')
  await secondary.getByLabel('Apelido da carteira').fill('Reserva')

  await secondary.getByLabel('Endereço da carteira').fill('0x123')
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(secondary.getByText(/Informe um endereço válido/)).toBeVisible()

  await secondary
    .getByLabel('Endereço da carteira')
    .fill('0x8ba1f109551bD432803012645Ac136ddd64DBA72')
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(secondary.getByText('Este endereço já está cadastrado')).toBeVisible()

  await secondary
    .getByLabel('Endereço da carteira')
    .fill('0x1111111111111111111111111111111111111111')
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira secundária salva.')).toBeVisible()

  await primary.getByLabel('Apelido da carteira').fill('Carteira do dia a dia')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira principal salva.')).toBeVisible()

  await reload(page)
  await expect(
    page.getByRole('form', { name: 'Carteira principal' }).getByLabel('Apelido da carteira'),
  ).toHaveValue('Carteira do dia a dia')
  await expect(
    page.getByRole('form', { name: 'Carteira secundária' }).getByLabel('Endereço da carteira'),
  ).toHaveValue('0x1111111111111111111111111111111111111111')
})
