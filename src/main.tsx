import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { queryClient } from '@/app/query-client'
import { router } from '@/app/router'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
