import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { facetsQuery } from '@/api/nfts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { networks, type Network } from '@/contracts/common'
import { categories, type Category } from '@/contracts/nft'
import { categoryLabels, networkLabels } from '@/lib/format'
import { formatEthComma, fromSliderValue, toSliderValue } from '@/lib/money'
import { cn } from 'cn'
import type { CatalogSearch } from './search'

const toggle = <T,>(list: T[] | undefined, value: T) =>
  list?.includes(value) ? list.filter((v) => v !== value) : [...(list ?? []), value]

function FacetList<T extends string>({
  title,
  values,
  labels,
  counts,
  selected,
  onToggle,
}: {
  title: string
  values: readonly T[]
  labels: Record<T, string>
  counts?: Record<T, number>
  selected?: T[]
  onToggle: (value: T) => void
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-3 text-lg font-bold tracking-wide">{title}</legend>
      {values.map((value) => {
        const active = selected?.includes(value) ?? false
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(value)}
            className={cn(
              'flex h-10 items-center justify-between rounded-sm px-3 text-[15px] tracking-wide text-muted-foreground hover:text-highlight focus-visible:outline-2 focus-visible:outline-ring',
              active && 'bg-muted text-highlight',
            )}
          >
            <span>{labels[value]}</span>
            {counts ? (
              <span className={cn(active && 'font-bold')}>({counts[value]})</span>
            ) : (
              <Skeleton className="h-4 w-8" />
            )}
          </button>
        )
      })}
    </fieldset>
  )
}

function PriceRange({
  search,
  onChange,
}: {
  search: CatalogSearch
  onChange: (patch: CatalogSearch) => void
}) {
  const facets = useQuery(facetsQuery).data
  const [draft, setDraft] = useState<[number, number] | null>(null)
  if (!facets) return <Skeleton className="h-24 w-full" />

  const bounds = [toSliderValue(facets.price.min), toSliderValue(facets.price.max)] as const
  const value = draft ?? [
    search.minPrice ? toSliderValue(search.minPrice) : bounds[0],
    search.maxPrice ? toSliderValue(search.maxPrice) : bounds[1],
  ]
  const [min, max] = value.map((v) => fromSliderValue(v))

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-lg font-bold tracking-wide">Faixa de preço</legend>
      <Slider
        min={bounds[0]}
        max={bounds[1]}
        step={0.01}
        value={value}
        onValueChange={(v) => setDraft([v[0], v[1]])}
        minStepsBetweenThumbs={1}
        aria-label="Faixa de preço"
        thumbLabels={['Preço mínimo', 'Preço máximo']}
      />
      <p className="px-3 text-sm tracking-wide" aria-live="polite">
        Preço: {formatEthComma(min)} - {formatEthComma(max)} ETH
      </p>
      <Button
        size="sm"
        className="ml-3 w-fit px-3 text-[15px]"
        onClick={() => {
          onChange({
            minPrice: value[0] > bounds[0] ? min : undefined,
            maxPrice: value[1] < bounds[1] ? max : undefined,
          })
          setDraft(null)
        }}
      >
        Aplicar
      </Button>
    </fieldset>
  )
}

/** Category, price and network filters. Every change resets pagination (handled by onChange). */
export function Filters({
  search,
  onChange,
}: {
  search: CatalogSearch
  onChange: (patch: CatalogSearch) => void
}) {
  const facets = useQuery(facetsQuery).data
  return (
    <div className="flex flex-col gap-8">
      <FacetList<Category>
        title="Coleções"
        values={categories}
        labels={categoryLabels}
        counts={facets?.categories}
        selected={search.category}
        onToggle={(c) => onChange({ category: toggle(search.category, c) })}
      />
      <PriceRange search={search} onChange={onChange} />
      <FacetList<Network>
        title="Rede"
        values={networks}
        labels={networkLabels}
        counts={facets?.networks}
        selected={search.network}
        onToggle={(n) => onChange({ network: toggle(search.network, n) })}
      />
    </div>
  )
}
