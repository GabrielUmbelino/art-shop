import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/_account/wallets')({
  component: WalletsPage,
})

function WalletsPage() {
  return <h1>Wallets</h1>
}
