import { setupWorker } from 'msw/browser'
import { initMocks, mockControl } from './control'
import { handlers } from './handlers'

export async function startMocks() {
  initMocks()
  await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass', quiet: true })
  // Exposed last, so waiting for window.__mock means REST and WebSocket interception are active.
  window.__mock = mockControl
}
