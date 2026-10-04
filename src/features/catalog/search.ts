import { z } from 'zod'
import { ethAmount, network } from '@/contracts/common'
import { category, sortOptions, tabs, type NftListQuery } from '@/contracts/nft'

/** Catalog state in the URL. Invalid values are dropped instead of failing the page. */
export const catalogSearch = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  category: z.array(category).min(1).optional().catch(undefined),
  network: z.array(network).min(1).optional().catch(undefined),
  minPrice: ethAmount.optional().catch(undefined),
  maxPrice: ethAmount.optional().catch(undefined),
  tab: z.enum(tabs).optional().catch(undefined),
  sort: z.enum(sortOptions).optional().catch(undefined),
  page: z.number().int().min(2).optional().catch(undefined),
})
export type CatalogSearch = z.infer<typeof catalogSearch>

export const toListQuery = (search: CatalogSearch): NftListQuery => ({
  ...search,
  page: search.page ?? 1,
})

/** Removes empty values so the URL only carries what differs from the defaults. */
export function cleanSearch(search: CatalogSearch): CatalogSearch {
  return Object.fromEntries(
    Object.entries(search).filter(
      ([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0),
    ),
  ) as CatalogSearch
}

export const hasFilters = (s: CatalogSearch) =>
  Boolean(s.q || s.category || s.network || s.minPrice || s.maxPrice || (s.tab && s.tab !== 'all'))
