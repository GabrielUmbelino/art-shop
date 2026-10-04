import { http, HttpResponse } from 'msw'
import {
  categories,
  nftListQuery,
  type Nft,
  type NftFacets,
  type NftList,
  type NftSummary,
} from '@/contracts/nft'
import { networks } from '@/contracts/common'
import { compare, max, min } from '@/lib/money'
import { db, findNft, toNft } from '../db/store'
import { fail, validate } from '../lib'

export const toSummary = ({
  description: _d,
  images: _i,
  editions: _e,
  maxPerOrder: _m,
  attributes: _a,
  contractAddress: _c,
  royaltyPercent: _r,
  rating: _rt,
  reviews: _rv,
  ...summary
}: Nft): NftSummary => summary

function parseQuery(url: URL) {
  const p = url.searchParams
  const number = (key: string) => (p.has(key) ? Number(p.get(key)) : undefined)
  return validate(nftListQuery, {
    q: p.get('q') ?? undefined,
    category: p.has('category') ? p.getAll('category') : undefined,
    network: p.has('network') ? p.getAll('network') : undefined,
    collection: p.get('collection') ?? undefined,
    tab: p.get('tab') ?? undefined,
    minPrice: p.get('minPrice') ?? undefined,
    maxPrice: p.get('maxPrice') ?? undefined,
    availableOnly: p.has('availableOnly') ? p.get('availableOnly') === 'true' : undefined,
    sort: p.get('sort') ?? undefined,
    page: number('page'),
    pageSize: number('pageSize'),
  })
}

const sorters = {
  newest: (a: Nft, b: Nft) => b.createdAt.localeCompare(a.createdAt),
  'price-asc': (a: Nft, b: Nft) => compare(a.price, b.price) || a.id.localeCompare(b.id),
  'price-desc': (a: Nft, b: Nft) => compare(b.price, a.price) || a.id.localeCompare(b.id),
  name: (a: Nft, b: Nft) => a.name.localeCompare(b.name),
}

export const nftHandlers = [
  http.get('/api/nfts', ({ request }) => {
    const query = parseQuery(new URL(request.url))
    const q = query.q?.toLowerCase()
    const items = db.nfts
      .map(toNft)
      .filter(
        (n) =>
          (!q ||
            [n.name, n.collection, n.creator.name].some((field) =>
              field.toLowerCase().includes(q),
            )) &&
          (!query.category || query.category.includes(n.category)) &&
          (!query.network || query.network.includes(n.network)) &&
          (!query.collection || n.collection === query.collection) &&
          (query.tab !== 'new' || n.isNew) &&
          (query.tab !== 'trending' || n.trending) &&
          (!query.minPrice || compare(n.price, query.minPrice) >= 0) &&
          (!query.maxPrice || compare(n.price, query.maxPrice) <= 0) &&
          (!query.availableOnly || n.available > 0),
      )
      .sort(sorters[query.sort])
    const start = (query.page - 1) * query.pageSize
    return HttpResponse.json<NftList>({
      items: items.slice(start, start + query.pageSize).map(toSummary),
      page: query.page,
      pageSize: query.pageSize,
      total: items.length,
      totalPages: Math.ceil(items.length / query.pageSize),
    })
  }),

  http.get('/api/nfts/facets', () => {
    const all = db.nfts.map(toNft)
    const count = <K extends string>(keys: readonly K[], pick: (n: Nft) => K) =>
      Object.fromEntries(keys.map((k) => [k, all.filter((n) => pick(n) === k).length])) as Record<
        K,
        number
      >
    const prices = all.map((n) => n.price)
    return HttpResponse.json<NftFacets>({
      categories: count(categories, (n) => n.category),
      networks: count(networks, (n) => n.network),
      price: prices.length ? { min: min(prices), max: max(prices) } : { min: '0', max: '0' },
    })
  }),

  http.get('/api/nfts/featured', () =>
    HttpResponse.json(db.nfts.filter((n) => n.featured).map((n) => toSummary(toNft(n)))),
  ),

  http.get('/api/nfts/:id', ({ params }) => {
    const record =
      findNft(params.id as string) ?? fail('NOT_FOUND', { message: 'Este NFT não existe' })
    return HttpResponse.json(toNft(record))
  }),
]
