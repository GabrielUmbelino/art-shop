import { queryOptions } from '@tanstack/react-query'
import { user } from '@/contracts/user'
import { http } from './http'
import { privateKey } from './keys'

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: privateKey(userId, 'profile'),
    queryFn: async ({ signal }) => user.parse((await http.get('/profile', { signal })).data),
  })
