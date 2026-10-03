import { createFileRoute } from '@tanstack/react-router'
import { AuthDialog } from '@/features/auth/auth-dialog'
import { authSearch } from '@/features/auth/redirect'
import { HomePage } from '@/features/catalog/home-page'

export const Route = createFileRoute('/signup')({
  validateSearch: authSearch,
  component: SignupPage,
})

function SignupPage() {
  return (
    <>
      <HomePage />
      <AuthDialog mode="signup" search={Route.useSearch()} />
    </>
  )
}
