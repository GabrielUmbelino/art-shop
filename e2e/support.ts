import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'
import type { ScenarioName } from '../src/mocks/scenarios'
// Type-only: brings in the window.__mock declaration without running mock code in Node.
import type {} from '../src/mocks/control'

/** Opens the app on a fresh mock database with the given scenario. */
export async function start(page: Page, scenario: ScenarioName = 'fast') {
  await page.goto(`/?scenario=${scenario}`)
  await page.waitForFunction(() => window.__mock !== undefined)
  await page.evaluate((name) => window.__mock.reset(name), scenario)
}

type ApiOptions = { body?: unknown; token?: string; headers?: Record<string, string> }

/** Calls the mock API from the page, so the request goes through the MSW service worker. */
export function api<T = unknown>(
  page: Page,
  method: string,
  path: string,
  options: ApiOptions = {},
) {
  return page.evaluate(
    async ({ method, path, body, token, headers }) => {
      const response = await fetch(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const text = await response.text()
      return { status: response.status, body: (text ? JSON.parse(text) : null) as T }
    },
    { method, path, ...options },
  )
}

export async function login(page: Page, email = 'ana@example.com') {
  const { body } = await api<{ token: string }>(page, 'POST', '/api/auth/login', {
    body: { email, password: 'Collector123' },
  })
  return body.token
}

/** Injects the real socket.io-client browser bundle as window.io. */
export async function injectSocketIo(page: Page) {
  // The package's exports map hides dist/, so point at the file directly.
  const path = fileURLToPath(
    new URL('../node_modules/socket.io-client/dist/socket.io.min.js', import.meta.url),
  )
  await page.addScriptTag({ path })
}
