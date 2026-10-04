import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { NftDetailPage } from '@/features/nft/detail-page'

export const Route = createFileRoute('/nft/$id')({
  validateSearch: z.object({ edition: z.string().optional().catch(undefined) }),
  component: NftDetail,
})

function NftDetail() {
  const { id } = Route.useParams()
  const { edition } = Route.useSearch()
  return <NftDetailPage id={id} edition={edition} />
}
