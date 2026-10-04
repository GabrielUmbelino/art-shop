import { queryOptions } from '@tanstack/react-query'
import { favorites } from '@/contracts/nft'
import { http } from './http'
import { privateKey } from './keys'

export const favoritesKey = (userId: string) => privateKey(userId, 'favorites')

export const favoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: favoritesKey(userId),
    queryFn: async ({ signal }) => favorites.parse((await http.get('/favorites', { signal })).data),
  })

export const favoritesApi = {
  add: async (nftId: string) => favorites.parse((await http.put(`/favorites/${nftId}`)).data),
  remove: async (nftId: string) => favorites.parse((await http.delete(`/favorites/${nftId}`)).data),
}
