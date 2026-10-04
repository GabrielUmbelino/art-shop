import { Link, useLocation } from '@tanstack/react-router'
import { LogInIcon } from 'lucide-react'
import { ComingSoon } from '@/components/coming-soon'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/use-auth'
import { CartIcon } from '@/features/cart/cart-badge'
import { cn } from 'cn'
import { HeaderSearch } from './header-search'
import { UserMenu } from './user-menu'

const navItem =
  'relative flex h-full items-center px-1 text-[15px] tracking-wide hover:text-highlight focus-visible:outline-2 focus-visible:outline-ring'
const activeItem =
  'text-highlight font-bold after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-highlight'

const marketPaths = ['/nft', '/cart', '/checkout', '/orders']

export function Header() {
  const session = useSession()
  const { pathname, href } = useLocation()
  const inMarket = marketPaths.some((p) => pathname.startsWith(p))

  return (
    <header className="max-md:hidden">
      <div className="page-container">
        <div className="grid h-[68px] grid-cols-[1fr_auto_1fr] items-center border-b border-border">
          <Link to="/" className="justify-self-start text-sm font-bold tracking-[0.15em]">
            KURIO
          </Link>

          <nav aria-label="Principal" className="flex h-full gap-12">
            <Link
              to="/"
              className={navItem}
              activeOptions={{ exact: true, includeHash: false }}
              activeProps={{ className: activeItem }}
            >
              Início
            </Link>
            <Link
              to="/"
              hash="mercado"
              className={cn(navItem, inMarket && activeItem)}
              aria-current={inMarket ? 'page' : undefined}
            >
              Mercado
            </Link>
            <ComingSoon className={navItem}>Criadores</ComingSoon>
            <ComingSoon className={navItem}>Aprenda</ComingSoon>
          </nav>

          <div className="flex items-center gap-6 justify-self-end">
            <HeaderSearch />
            <Link to="/cart" className="hover:text-highlight">
              <span className="sr-only">Carrinho</span>
              <CartIcon />
            </Link>
            {session ? (
              <UserMenu user={session.user} />
            ) : (
              <Button asChild className="h-[34px] px-3 text-[15px]">
                <Link to="/login" search={{ redirect: href }}>
                  <LogInIcon className="size-5" /> Entrar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
