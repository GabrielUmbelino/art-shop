import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { nft, nftFacets, nftList, nftSummary, type NftListQuery } from '@/contracts/nft'
import { http, parse } from './http'

export const nftKeys = {
  all: ['nfts'] as const,
  list: (params: NftListQuery) => ['nfts', 'list', params] as const,
  detail: (id: string) => ['nfts', 'detail', id] as const,
  facets: ['nfts', 'facets'] as const,
  featured: ['nfts', 'featured'] as const,
}

/** Keyed by every parameter, so a slow response for old filters can never replace newer results. */
export const nftListQuery = (params: NftListQuery) =>
  queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: async ({ signal }) =>
      parse(nftList, (await http.get('/nfts', { params, signal })).data),
    placeholderData: keepPreviousData,
  })

export const nftQuery = (id: string) =>
  queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: async ({ signal }) => parse(nft, (await http.get(`/nfts/${id}`, { signal })).data),
  })

export const facetsQuery = queryOptions({
  queryKey: nftKeys.facets,
  queryFn: async ({ signal }) =>
    parse(nftFacets, (await http.get('/nfts/facets', { signal })).data),
  staleTime: 5 * 60_000,
})

export const featuredQuery = queryOptions({
  queryKey: nftKeys.featured,
  queryFn: async ({ signal }) =>
    parse(z.array(nftSummary), (await http.get('/nfts/featured', { signal })).data),
})
