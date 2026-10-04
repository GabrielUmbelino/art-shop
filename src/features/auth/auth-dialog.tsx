import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { FacebookLogo, GoogleLogo } from '@/components/provider-logos'
import { ComingSoon } from '@/components/coming-soon'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from 'cn'
import { LoginForm } from './login-form'
import type { AuthSearch } from './redirect'
import { SignupForm } from './signup-form'

const copy = {
  login: {
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    mobileTitle: 'Entrar',
  },
  signup: {
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    mobileTitle: 'Criar perfil de colecionador',
  },
}

/** Login and sign-up: a dialog over the page on desktop, a full page on mobile (as designed). */
export function AuthDialog({ mode, search }: { mode: 'login' | 'signup'; search: AuthSearch }) {
  const navigate = useNavigate()
  const router = useRouter()
  // Signed in: continue to the page that asked for it.
  const done = () => void navigate({ href: search.redirect ?? '/', replace: true })
  // Dismissed: go back to where the user was. Not to `redirect`, which may be a private page whose
  // guard would open this dialog again.
  const dismiss = () =>
    router.history.canGoBack() ? router.history.back() : void navigate({ to: '/', replace: true })
  const tabSearch = { redirect: search.redirect }

  return (
    <Dialog open onOpenChange={(open) => !open && dismiss()}>
      <DialogContent
        className={cn(
          'flex flex-col gap-6 border-0 bg-card p-0 sm:max-w-[500px]',
          'max-md:inset-0 max-md:top-0 max-md:left-0 max-md:h-dvh max-md:max-w-none max-md:translate-0 max-md:overflow-y-auto max-md:rounded-none max-md:bg-background',
          'md:rounded-none md:border-b-8 md:border-primary',
        )}
      >
        <div className="flex flex-col gap-4 px-6 pt-10 md:px-20">
          <p
            aria-hidden="true"
            className="pt-6 text-center text-3xl font-bold tracking-[0.15em] md:hidden"
          >
            KURIO
          </p>
          <DialogTitle className="text-center text-xl font-medium tracking-wide max-md:pt-10">
            <span className="md:hidden">{copy[mode].mobileTitle}</span>
            <nav
              aria-label="Acesso"
              className="flex items-center justify-center gap-2 max-md:hidden"
            >
              <Link
                to="/login"
                search={tabSearch}
                replace
                className={cn(mode === 'login' && 'text-highlight')}
                aria-current={mode === 'login' ? 'page' : undefined}
              >
                Entrar
              </Link>
              <span aria-hidden="true" className="h-6 w-px bg-primary" />
              <Link
                to="/signup"
                search={tabSearch}
                replace
                className={cn(mode === 'signup' && 'text-highlight')}
                aria-current={mode === 'signup' ? 'page' : undefined}
              >
                Criar conta
              </Link>
            </nav>
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-foreground max-md:hidden">
            {copy[mode].description}
          </DialogDescription>
          {search.reason === 'expired' && (
            <output className="rounded-sm border border-primary px-3 py-2 text-center text-sm text-highlight">
              Sua sessão expirou. Entre novamente para continuar de onde parou.
            </output>
          )}
          {mode === 'login' ? <LoginForm onSuccess={done} /> : <SignupForm onSuccess={done} />}
        </div>

        <div className="flex flex-col gap-3 px-6 pb-10 md:px-20">
          <div className="relative flex items-center justify-center md:-mx-20">
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden="true" />
            <span className="relative bg-card px-3 text-xs max-md:bg-background">
              Ou continue com
            </span>
          </div>
          <ComingSoon className="flex h-10 items-center justify-center gap-2 rounded-sm border border-border text-xs text-highlight hover:bg-muted">
            <GoogleLogo className="size-5" /> Continuar com Google
          </ComingSoon>
          <ComingSoon className="flex h-10 items-center justify-center gap-2 rounded-sm border border-border text-xs text-highlight hover:bg-muted">
            <FacebookLogo className="size-5" /> Continuar com Facebook
          </ComingSoon>
          <p className="pt-6 text-center text-sm md:hidden">
            {mode === 'login' ? (
              <Link to="/signup" search={tabSearch} replace>
                Novo na Kurio? Crie uma conta
              </Link>
            ) : (
              <Link to="/login" search={tabSearch} replace>
                Já tem uma conta? Entre
              </Link>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
