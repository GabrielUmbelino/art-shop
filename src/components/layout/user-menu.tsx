import { Link } from '@tanstack/react-router'
import { ChevronDownIcon, HeartIcon, LogOutIcon, UserIcon, WalletIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '@/contracts/user'
import { useLogout } from '@/features/auth/use-auth'

/** Signed-in replacement for the "Entrar" button. Not in the design; built from its tokens. */
export function UserMenu({ user }: { user: User }) {
  const logout = useLogout()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-sm px-1 py-1 text-[15px] hover:text-highlight focus-visible:outline-2 focus-visible:outline-ring">
        <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary font-bold text-primary-foreground">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            user.name[0]?.toUpperCase()
          )}
        </span>
        <span className="max-w-32 truncate">{user.name}</span>
        <ChevronDownIcon className="size-4" />
        <span className="sr-only">Menu da conta</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="text-subtle">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserIcon /> Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/wallets">
            <WalletIcon /> Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/favorites">
            <HeartIcon /> Lista de interesse
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout.mutate()}>
          <LogOutIcon /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
