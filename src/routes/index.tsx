import { createFileRoute } from '@tanstack/react-router'
import { facetsQuery, featuredQuery, nftListQuery } from '@/api/nfts'
import { HomePage } from '@/features/catalog/home-page'
import { catalogSearch, toListQuery } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearch,
  loaderDeps: ({ search }) => search,
  // Starts the catalog requests while the page's code loads (not awaited: the page shows skeletons).
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(nftListQuery(toListQuery(deps)))
    void queryClient.prefetchQuery(facetsQuery)
    void queryClient.prefetchQuery(featuredQuery)
  },
  component: Home,
})

function Home() {
  return <HomePage search={Route.useSearch()} />
}
