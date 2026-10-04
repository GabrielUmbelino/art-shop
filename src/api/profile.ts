import { queryOptions } from '@tanstack/react-query'
import { user, type PasswordChangeBody, type ProfileUpdateBody } from '@/contracts/user'
import { http } from './http'
import { privateKey } from './keys'

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: privateKey(userId, 'profile'),
    queryFn: async ({ signal }) => user.parse((await http.get('/profile', { signal })).data),
  })

export const profileApi = {
  update: async (body: ProfileUpdateBody) => user.parse((await http.patch('/profile', body)).data),
  changePassword: async (body: PasswordChangeBody) => {
    await http.put('/profile/password', body)
  },
}
