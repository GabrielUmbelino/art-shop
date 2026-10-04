import { useNavigate } from '@tanstack/react-router'
import { cleanSearch, type CatalogSearch } from './search'

export function useCatalogNavigation(search: CatalogSearch) {
  const navigate = useNavigate()
  /** Any change other than the page itself goes back to page 1. */
  return (patch: CatalogSearch) =>
    void navigate({
      to: '/',
      search: cleanSearch({ ...search, ...patch, page: 'page' in patch ? patch.page : undefined }),
      resetScroll: false,
    })
}
