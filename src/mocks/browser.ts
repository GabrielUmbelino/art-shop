import { setupWorker } from 'msw/browser'
import { initMocks, mockControl } from './control'
import { handlers } from './handlers'

export async function startMocks() {
  initMocks()
  await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass', quiet: true })
  // The browser stops an idle service worker (a background tab throttles MSW's keepalive). The
  // restarted worker has forgotten this tab and passes every request to the network, so announce
  // the tab again whenever it comes back into view.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.controller?.postMessage('MOCK_ACTIVATE')
    }
  })
  // Exposed last, so waiting for window.__mock means REST and WebSocket interception are active.
  window.__mock = mockControl
}
