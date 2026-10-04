import { createFileRoute } from '@tanstack/react-router'
import { AccountLayout } from '@/features/account/account-layout'

/** Pathless layout with the account sidebar (profile, wallets, wish list). */
export const Route = createFileRoute('/_authenticated/_account')({
  component: AccountLayout,
})
