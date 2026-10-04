import { queryOptions } from '@tanstack/react-query'
import { session, type LoginBody, type SignupBody } from '@/contracts/user'
import { getToken } from '@/lib/session-store'
import { http, parse } from './http'

export const sessionKey = ['session'] as const

/** The current session, or null when signed out. Fetched once, then kept in sync by auth actions. */
export const sessionQuery = queryOptions({
  queryKey: sessionKey,
  queryFn: async ({ signal }) => {
    if (!getToken()) return null
    try {
      return parse(session, (await http.get('/auth/session', { signal })).data)
    } catch (error) {
      // An invalid token was already cleared by the http client; treat it as signed out.
      if (!getToken()) return null
      throw error
    }
  },
  staleTime: Infinity,
})

export const authApi = {
  login: async (body: LoginBody) => parse(session, (await http.post('/auth/login', body)).data),
  signup: async (body: SignupBody) => parse(session, (await http.post('/auth/signup', body)).data),
  logout: () => http.post('/auth/logout'),
}
