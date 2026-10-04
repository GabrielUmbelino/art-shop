import { queryOptions } from '@tanstack/react-query'
import { user, type PasswordChangeBody, type ProfileUpdateBody } from '@/contracts/user'
import { http, parse } from './http'
import { privateKey } from './keys'

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: privateKey(userId, 'profile'),
    queryFn: async ({ signal }) => parse(user, (await http.get('/profile', { signal })).data),
  })

export const profileApi = {
  update: async (body: ProfileUpdateBody) => parse(user, (await http.patch('/profile', body)).data),
  changePassword: async (body: PasswordChangeBody) => {
    await http.put('/profile/password', body)
  },
}
