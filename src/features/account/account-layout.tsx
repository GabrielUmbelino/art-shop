import { Link, Outlet } from '@tanstack/react-router'
import {
  AlertTriangleIcon,
  DownloadIcon,
  HeartIcon,
  LogOutIcon,
  MapPinIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  UserIcon,
} from 'lucide-react'
import { ComingSoon } from '@/components/coming-soon'
import { useLogout } from '@/features/auth/use-auth'

const item =
  'relative flex shrink-0 items-center gap-3 px-4 py-3 text-[15px] tracking-wide whitespace-nowrap text-primary hover:text-highlight focus-visible:outline-2 focus-visible:outline-ring max-lg:rounded-full max-lg:border max-lg:border-border max-lg:py-2'
const active = {
  className:
    'text-highlight lg:before:absolute lg:before:inset-y-0 lg:before:left-0 lg:before:w-1.5 lg:before:bg-primary max-lg:border-primary',
  'aria-current': 'page' as const,
}

/** Account sidebar from the profile and wallets designs; a scrolling row of tabs on mobile. */
export function AccountLayout() {
  const logout = useLogout()
  return (
    <div className="page-container grid gap-6 py-8 lg:grid-cols-[310px_1fr] lg:gap-7">
      <aside className="min-w-0 lg:self-start lg:bg-card">
        <h2 className="px-2.5 pt-6 pb-2 text-lg font-bold max-lg:sr-only">Meu perfil</h2>
        <nav aria-label="Minha conta">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:pb-0">
            <li>
              <Link to="/profile" className={item} activeProps={active}>
                <UserIcon className="size-4" /> Dados do perfil
              </Link>
            </li>
            <li>
              <Link to="/wallets" className={item} activeProps={active}>
                <MapPinIcon className="size-4" /> Carteiras
              </Link>
            </li>
            <li className="max-lg:hidden">
              <ComingSoon className={item}>
                <ShoppingCartIcon className="size-4" /> Atividade
              </ComingSoon>
            </li>
            <li>
              <Link to="/favorites" className={item} activeProps={active}>
                <HeartIcon className="size-4" /> Lista de interesse
              </Link>
            </li>
            {[
              { label: 'Ofertas', Icon: TrendingUpIcon },
              { label: 'Arquivos baixados', Icon: DownloadIcon },
              { label: 'Suporte', Icon: AlertTriangleIcon },
            ].map(({ label, Icon }) => (
              <li key={label} className="max-lg:hidden">
                <ComingSoon className={item}>
                  <Icon className="size-4" /> {label}
                </ComingSoon>
              </li>
            ))}
            <li className="lg:border-t lg:border-border">
              <button
                type="button"
                onClick={() => logout.mutate()}
                className={`${item} font-bold text-highlight`}
              >
                <LogOutIcon className="size-4" /> Sair
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
