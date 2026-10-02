import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/wallets')({
  component: WalletsPage,
})

function WalletsPage() {
  return <h1>Wallets</h1>
}
