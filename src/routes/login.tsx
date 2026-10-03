import { createFileRoute } from '@tanstack/react-router'
import { AuthDialog } from '@/features/auth/auth-dialog'
import { authSearch } from '@/features/auth/redirect'
import { HomePage } from '@/features/catalog/home-page'

export const Route = createFileRoute('/login')({
  validateSearch: authSearch,
  component: LoginPage,
})

function LoginPage() {
  return (
    <>
      <HomePage />
      <AuthDialog mode="login" search={Route.useSearch()} />
    </>
  )
}
