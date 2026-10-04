import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/catalog/home-page'
import { catalogSearch } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearch,
  component: Home,
})

function Home() {
  return <HomePage search={Route.useSearch()} />
}
