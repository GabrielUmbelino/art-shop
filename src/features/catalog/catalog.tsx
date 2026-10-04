import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { SearchIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react'
import { useEffect, useEffectEvent, useState } from 'react'
import { featuredQuery, nftListQuery } from '@/api/nfts'
import { NftImage } from '@/components/nft-image'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { sortOptions, tabs } from '@/contracts/nft'
import { cn } from 'cn'
import { Filters } from './filters'
import { NftCard, NftCardSkeleton } from './nft-card'
import { Pagination } from './pagination'
import { hasFilters, toListQuery, type CatalogSearch } from './search'
import { useCatalogNavigation } from './use-catalog-navigation'

const tabLabels: Record<(typeof tabs)[number], string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}
const sortLabels: Record<(typeof sortOptions)[number], string> = {
  newest: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  name: 'Nome (A-Z)',
}

function FeaturedOffer() {
  const offer = useQuery(featuredQuery).data?.find((n) => n.compareAtPrice)
  if (!offer) return null
  return (
    <Link
      to="/nft/$id"
      params={{ id: offer.id }}
      className="group flex flex-col gap-2 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <p className="text-xl font-bold tracking-wide text-highlight uppercase">NFT em destaque</p>
      <p className="text-center text-lg font-bold tracking-wide uppercase">Oferta limitada</p>
      <NftImage src={offer.image} alt={offer.name} sizes="310px" className="rounded-2xl" />
      <span className="sr-only">{offer.name}</span>
    </Link>
  )
}

function SearchBar({
  search,
  onChange,
}: {
  search: CatalogSearch
  onChange: (patch: CatalogSearch) => void
}) {
  const [text, setText] = useState(search.q ?? '')
  const commit = useEffectEvent((q: string | undefined) => onChange({ q }))
  // Typing updates the URL after a pause; each settled search is a history entry.
  useEffect(() => {
    const next = text.trim() || undefined
    if (next === search.q) return
    const timer = setTimeout(() => commit(next), 400)
    return () => clearTimeout(timer)
  }, [text, search.q])

  return (
    <search className="relative flex-1">
      <form onSubmit={(e) => (e.preventDefault(), onChange({ q: text.trim() || undefined }))}>
        <label htmlFor="catalog-search" className="sr-only">
          Buscar NFTs
        </label>
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
          aria-hidden="true"
        />
        <input
          id="catalog-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Explorar coleções"
          className="h-11 w-full rounded-xl bg-card pr-3 pl-9 text-sm placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-ring"
        />
      </form>
    </search>
  )
}

/** Mobile search bar and filters sheet; the design places them above the hero. */
export function MobileCatalogBar({ search }: { search: CatalogSearch }) {
  const update = useCatalogNavigation(search)
  return (
    <div className="page-container flex gap-3 pt-4 md:hidden">
      {/* Keyed by the query so back/forward navigation resets the field. */}
      <SearchBar key={search.q ?? ''} search={search} onChange={update} />
      <Sheet>
        <SheetTrigger asChild>
          <Button className="size-11 rounded-xl p-0" aria-label="Filtros">
            <SlidersHorizontalIcon className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="overflow-y-auto bg-card p-6">
          <SheetTitle className="text-lg font-bold">Filtros</SheetTitle>
          <SheetDescription className="sr-only">
            Refine o catálogo por coleção, preço e rede.
          </SheetDescription>
          <Filters search={search} onChange={update} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function Catalog({ search }: { search: CatalogSearch }) {
  const update = useCatalogNavigation(search)
  const list = useQuery(nftListQuery(toListQuery(search)))
  const page = search.page ?? 1

  const changePage = (next: number) => {
    update({ page: next > 1 ? next : undefined })
    document.getElementById('mercado')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section
      id="mercado"
      aria-labelledby="catalog-title"
      className="page-container scroll-mt-4 py-8 md:py-16"
    >
      <h2 id="catalog-title" className="sr-only">
        Mercado de NFTs
      </h2>

      <div className="grid gap-12 md:grid-cols-[minmax(240px,310px)_1fr]">
        <aside className="flex flex-col gap-10 max-md:hidden" aria-label="Filtros">
          <div className="bg-card p-5">
            <Filters search={search} onChange={update} />
          </div>
          <FeaturedOffer />
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-4 overflow-x-auto md:gap-5">
              {tabs.map((tab) => {
                const active = (search.tab ?? 'all') === tab
                return (
                  <button
                    key={tab}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ tab: tab === 'all' ? undefined : tab })}
                    className={cn(
                      'shrink-0 border-b-2 border-transparent pb-1 text-sm font-bold tracking-wide whitespace-nowrap hover:text-highlight focus-visible:outline-2 focus-visible:outline-ring',
                      active && 'border-highlight text-highlight',
                    )}
                  >
                    {tabLabels[tab]}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2 text-sm max-md:hidden">
              <label htmlFor="catalog-sort" className="tracking-wide">
                Ordenar por:
              </label>
              <Select
                value={search.sort ?? 'newest'}
                onValueChange={(v) =>
                  update({ sort: v === 'newest' ? undefined : (v as CatalogSearch['sort']) })
                }
              >
                <SelectTrigger
                  id="catalog-sort"
                  className="h-8 border-0 bg-transparent px-1 text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {sortLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(search.q || hasFilters(search)) && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {search.q && <span>Resultados para “{search.q}”</span>}
              <button
                type="button"
                onClick={() =>
                  update({
                    q: undefined,
                    category: undefined,
                    network: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    tab: undefined,
                  })
                }
                className="flex items-center gap-1 text-highlight hover:underline"
              >
                <XIcon className="size-4" /> Limpar filtros
              </button>
            </div>
          )}

          <p className="sr-only" aria-live="polite">
            {list.data && !list.isPlaceholderData ? `${list.data.total} NFTs encontrados` : ''}
          </p>

          {list.isError && !list.data ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-4 bg-card py-16 text-center"
            >
              <p className="font-bold">Não foi possível carregar o catálogo.</p>
              <p className="text-sm text-muted-foreground">{list.error.message}</p>
              <Button onClick={() => list.refetch()} disabled={list.isFetching}>
                {list.isFetching ? 'Tentando...' : 'Tentar novamente'}
              </Button>
            </div>
          ) : list.data?.items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 bg-card py-16 text-center">
              <p className="font-bold">Nenhum NFT encontrado.</p>
              <p className="text-sm text-muted-foreground">
                Ajuste a busca ou os filtros para ver mais resultados.
              </p>
            </div>
          ) : (
            <ul
              aria-busy={list.isFetching}
              className={cn(
                'grid grid-cols-2 gap-x-3 gap-y-8 transition-opacity md:gap-x-6 lg:grid-cols-3 lg:gap-x-[34px] lg:gap-y-14',
                list.isPlaceholderData && 'opacity-60',
              )}
            >
              {list.data
                ? list.data.items.map((nft, i) => (
                    <li key={nft.id}>
                      <NftCard nft={nft} priority={i < 3} />
                    </li>
                  ))
                : Array.from({ length: 9 }, (_, i) => (
                    <li key={i}>
                      <NftCardSkeleton />
                    </li>
                  ))}
            </ul>
          )}

          {list.data && (
            <Pagination page={page} totalPages={list.data.totalPages} onChange={changePage} />
          )}
        </div>
      </div>
    </section>
  )
}
