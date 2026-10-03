import { http, HttpResponse } from 'msw'
import { nftListQuery, type NftList, type NftSummary, type Nft } from '@/contracts/nft'
import { compare } from '@/lib/money'
import { db, findNft, toNft } from '../db/store'
import { fail, validate } from '../lib'

export const toSummary = ({
  description: _d,
  images: _i,
  editions: _e,
  maxPerOrder: _m,
  ...summary
}: Nft): NftSummary => summary

function parseQuery(url: URL) {
  const p = url.searchParams
  const number = (key: string) => (p.has(key) ? Number(p.get(key)) : undefined)
  return validate(nftListQuery, {
    q: p.get('q') ?? undefined,
    category: p.has('category') ? p.getAll('category') : undefined,
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

  http.get('/api/nfts/featured', () =>
    HttpResponse.json(db.nfts.filter((n) => n.featured).map((n) => toSummary(toNft(n)))),
  ),

  http.get('/api/nfts/:id', ({ params }) => {
    const record =
      findNft(params.id as string) ?? fail('NOT_FOUND', { message: 'Este NFT não existe' })
    return HttpResponse.json(toNft(record))
  }),
]
