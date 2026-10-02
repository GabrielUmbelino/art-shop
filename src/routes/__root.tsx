import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <>
      <header>
        <nav aria-label="Main">
          <Link to="/">Home</Link> <Link to="/cart">Cart</Link> <Link to="/login">Login</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}

function NotFound() {
  return (
    <section>
      <h1>Page not found</h1>
      <Link to="/">Back to home</Link>
    </section>
  )
}
