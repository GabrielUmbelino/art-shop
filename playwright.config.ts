import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  expect: {
    // Visual baselines: stable data (fast scenario), no animations or caret; tiny tolerance for antialiasing.
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.002 },
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
      // Viewport independent (API) or sets its own viewports (responsive).
      testIgnore: ['mock-api.spec.ts', 'responsive.spec.ts'],
    },
  ],
  webServer: {
    command: 'pnpm dev --port 5173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
