import './index.css'

async function enableMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const [{ startMocks }, { mountMockPanel }] = await Promise.all([
    import('@/mocks/browser'),
    import('@/mocks/panel'),
  ])
  await startMocks()
  mountMockPanel()
}

// The app and the mock layer download in parallel; the app renders once the mocks intercept requests.
// Loading the app early is safe because socket.io-client, the one module that must see the patched
// WebSocket, is imported lazily (src/realtime/socket.ts).
const app = import('@/app/render')
await enableMocks()
// User Timing marks: Lighthouse reports them, showing the cost of the mock layer before the first render.
performance.mark('kurio:mocks-ready')
const { renderApp } = await app
renderApp()
performance.mark('kurio:render')
