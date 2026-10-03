import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQuery } from '@/api/auth'

/** Pathless layout for pages that require a session (checkout, orders, profile, wallets, favorites). */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: Outlet,
})
