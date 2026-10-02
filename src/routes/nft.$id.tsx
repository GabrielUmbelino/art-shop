import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nft/$id')({
  component: NftDetailPage,
})

function NftDetailPage() {
  return <h1>NFT details</h1>
}
