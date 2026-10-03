import { http, HttpResponse } from 'msw'
import type { Favorites } from '@/contracts/nft'
import { db, findNft, save, toNft } from '../db/store'
import { fail, requireUser } from '../lib'
import { toSummary } from './nfts'

function list(userId: string) {
  const ids = db.favorites[userId] ?? []
  return HttpResponse.json<Favorites>({ items: ids.map((id) => toSummary(toNft(findNft(id)!))) })
}

export const favoriteHandlers = [
  http.get('/api/favorites', ({ request }) => list(requireUser(request).id)),

  http.put('/api/favorites/:nftId', ({ request, params }) => {
    const user = requireUser(request)
    const nftId = params.nftId as string
    if (!findNft(nftId)) fail('NOT_FOUND', { message: 'Este NFT não existe' })
    const ids = (db.favorites[user.id] ??= [])
    if (!ids.includes(nftId)) ids.push(nftId)
    save()
    return list(user.id)
  }),

  http.delete('/api/favorites/:nftId', ({ request, params }) => {
    const user = requireUser(request)
    db.favorites[user.id] = (db.favorites[user.id] ?? []).filter((id) => id !== params.nftId)
    save()
    return list(user.id)
  }),
]
