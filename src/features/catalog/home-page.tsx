import { Catalog, MobileCatalogBar } from './catalog'
import { Hero } from './hero'
import { Journal, Promos } from './promos'
import type { CatalogSearch } from './search'

/** Also rendered behind the login and sign-up dialogs, with the default catalog state. */
export function HomePage({ search = {} }: { search?: CatalogSearch }) {
  return (
    <>
      <MobileCatalogBar search={search} />
      <Hero />
      <Catalog search={search} />
      <Promos />
      <Journal />
    </>
  )
}
