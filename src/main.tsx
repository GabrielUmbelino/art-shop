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

await enableMocks()
// The app is imported only after the mocks patch fetch and WebSocket: socket.io-client (engine.io)
// reads globalThis.WebSocket once, when its module is evaluated.
await import('@/app/render')
