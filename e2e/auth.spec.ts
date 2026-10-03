import { expect, test, type Page } from '@playwright/test'
import { start } from './support'

const dialog = (page: Page) => page.getByRole('dialog')

async function fillLogin(page: Page, email: string, password = 'Collector123') {
  await dialog(page).getByLabel('E-mail').fill(email)
  await dialog(page).getByLabel('Senha', { exact: true }).fill(password)
  await dialog(page).getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function logout(page: Page) {
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
}

test('sign up: validation, conflict and success', async ({ page }) => {
  await start(page)
  await page.goto('/signup')
  const form = dialog(page)
  const submit = form.getByRole('button', { name: /Criar (conta|perfil)/ })

  await submit.click()
  await expect(form.getByText('Use de 3 a 20 letras minúsculas, números ou _')).toBeVisible()
  await expect(form.getByText('Informe um e-mail válido')).toBeVisible()
  await expect(form.getByLabel('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')

  await form.getByLabel('Nome de usuário').fill('carla')
  await form.getByLabel('E-mail').fill('ana@example.com')
  await form.getByLabel('Senha', { exact: true }).fill('Secret123')
  await form.getByLabel('Confirmar senha').fill('Secret124')
  await submit.click()
  await expect(form.getByText('As senhas não coincidem')).toBeVisible()

  await form.getByLabel('Confirmar senha').fill('Secret123')
  await submit.click()
  await expect(form.getByText('Já existe uma conta com este e-mail')).toBeVisible()

  await form.getByLabel('E-mail').fill('carla@example.com')
  await submit.click()
  await expect(dialog(page)).toBeHidden()
  await page.goto('/profile')
  await expect(page.getByTestId('profile-name')).toHaveText('carla')
})

test('login: errors, return to the requested page, session survives refresh', async ({ page }) => {
  await start(page)
  await page.goto('/profile')
  await expect(page).toHaveURL('/login?redirect=%2Fprofile')

  await fillLogin(page, 'ana@example.com', 'wrong-password')
  await expect(dialog(page).getByText('E-mail ou senha inválidos')).toBeVisible()

  await fillLogin(page, 'ana@example.com')
  await expect(page).toHaveURL('/profile')
  await expect(page.getByTestId('profile-name')).toHaveText('Ana Souza')

  await page.reload()
  await expect(page.getByTestId('profile-name')).toHaveText('Ana Souza')
})

test('session expiry during navigation returns to the page after signing in again', async ({
  page,
}) => {
  await start(page)
  await page.goto('/login')
  await fillLogin(page, 'ana@example.com')
  await expect(dialog(page)).toBeHidden()

  await page.evaluate(() => window.__mock.expireSessions())
  // Client-side navigation: the cached session lets the guard pass, the API then rejects the token.
  await page.getByRole('contentinfo').getByRole('link', { name: 'Meu perfil' }).click()

  await expect(page.getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeVisible()
  await expect(page).toHaveURL('/login?redirect=%2Fprofile&reason=expired')
  await expect(
    dialog(page).getByText('Sua sessão expirou. Entre novamente para continuar de onde parou.'),
  ).toBeVisible()

  await fillLogin(page, 'ana@example.com')
  await expect(page).toHaveURL('/profile')
  await expect(page.getByTestId('profile-name')).toHaveText('Ana Souza')
})

test('logout and user switch never show the previous user data', async ({ page }) => {
  await start(page)
  await page.goto('/login?redirect=%2Fprofile')
  await fillLogin(page, 'ana@example.com')
  await expect(page.getByTestId('profile-name')).toHaveText('Ana Souza')

  await logout(page)
  expect(await page.evaluate(() => localStorage.getItem('kurio:token'))).toBeNull()
  await page.goto('/profile')
  await expect(page).toHaveURL('/login?redirect=%2Fprofile')

  const names: string[] = []
  page.on('response', async (response) => {
    if (response.url().endsWith('/api/profile')) names.push((await response.json()).name)
  })
  await fillLogin(page, 'bruno@example.com')
  await expect(page.getByTestId('profile-name')).toHaveText('Bruno Costa')
  expect(names).toEqual(['Bruno Costa'])
})

test('header shows the signed-in user and logs out from the menu', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The header is desktop only')
  await start(page)
  await page.goto('/login')
  await fillLogin(page, 'ana@example.com')
  const menu = page.getByRole('button', { name: /Menu da conta/ })
  await expect(menu).toContainText('Ana Souza')
  await menu.click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('banner').getByRole('link', { name: 'Entrar' })).toBeVisible()
})
