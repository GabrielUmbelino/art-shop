import { useQuery } from '@tanstack/react-query'
import { profileQuery } from '@/api/profile'
import { LogOutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLogout, useSession } from '@/features/auth/use-auth'

/** Minimal profile page (the form arrives in Phase 6). Reads private data scoped to the session user. */
export function ProfilePage() {
  const session = useSession()
  const logout = useLogout()
  const profile = useQuery({ ...profileQuery(session?.user.id ?? ''), enabled: !!session })

  return (
    <section className="page-container flex flex-col gap-4 py-8">
      <h1 className="text-base font-bold tracking-wide">Perfil do colecionador</h1>
      {profile.data ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-subtle">Nome de exibição</dt>
          <dd data-testid="profile-name">{profile.data.name}</dd>
          <dt className="text-subtle">E-mail</dt>
          <dd>{profile.data.email}</dd>
        </dl>
      ) : (
        <Skeleton className="h-12 w-72" />
      )}
      <Button variant="outline" className="w-fit" onClick={() => logout.mutate()}>
        <LogOutIcon /> Sair
      </Button>
    </section>
  )
}
