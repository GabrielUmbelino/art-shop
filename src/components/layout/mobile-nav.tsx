import { Link, useLocation } from '@tanstack/react-router'
import { HeartIcon, HouseIcon, ShoppingBasketIcon, ShoppingCartIcon, UserIcon } from 'lucide-react'

const item =
  'flex size-12 items-center justify-center rounded-full text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring'
const active = { className: 'text-highlight', 'aria-current': 'page' as const }

/** Bottom tab bar from the mobile home design; icons are filled as designed. */
export function MobileNav() {
  // The NFT page has its own fixed purchase panel instead (as designed).
  if (useLocation().pathname.startsWith('/nft/')) return null
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-[32px] bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="relative mx-auto grid h-16 max-w-[414px] grid-cols-5 items-center justify-items-center">
        <Link
          to="/"
          className={item}
          activeOptions={{ exact: true, includeHash: false }}
          activeProps={active}
        >
          <HouseIcon className="size-6 fill-current" />
          <span className="sr-only">Início</span>
        </Link>
        <Link to="/favorites" className={item} activeProps={active}>
          <HeartIcon className="size-6 fill-current" />
          <span className="sr-only">Lista de interesse</span>
        </Link>
        <Link
          to="/"
          hash="mercado"
          className="-mt-10 flex size-16 items-center justify-center rounded-full bg-primary text-foreground shadow-[0_0_0_8px_var(--background)] focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ShoppingBasketIcon className="size-7" />
          <span className="sr-only">Mercado</span>
        </Link>
        <Link to="/cart" className={item} activeProps={active}>
          <ShoppingCartIcon className="size-6 fill-current" />
          <span className="sr-only">Carrinho</span>
        </Link>
        <Link to="/profile" className={item} activeProps={active}>
          <UserIcon className="size-6 fill-current" />
          <span className="sr-only">Perfil</span>
        </Link>
      </div>
    </nav>
  )
}
