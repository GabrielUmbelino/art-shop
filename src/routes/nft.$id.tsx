import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { nftQuery } from '@/api/nfts'
import { NftDetailPage } from '@/features/nft/detail-page'

export const Route = createFileRoute('/nft/$id')({
  validateSearch: z.object({ edition: z.string().optional().catch(undefined) }),
  // Starts the request while the page's code loads (not awaited: the page shows a skeleton).
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(nftQuery(params.id))
  },
  component: NftDetail,
})

function NftDetail() {
  const { id } = Route.useParams()
  const { edition } = Route.useSearch()
  return <NftDetailPage id={id} edition={edition} />
}
