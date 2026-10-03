import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, sessionKey, sessionQuery } from '@/api/auth'
import type { Session } from '@/contracts/user'
import { setToken } from '@/lib/session-store'

export const useSession = () => useQuery(sessionQuery).data ?? null

/** Storing the token notifies the session watcher, which clears the previous user's private data. */
function useStartSession() {
  const queryClient = useQueryClient()
  return (session: Session) => {
    setToken(session.token)
    queryClient.setQueryData(sessionKey, session)
  }
}

export function useLogin() {
  const startSession = useStartSession()
  return useMutation({ mutationFn: authApi.login, onSuccess: startSession })
}

export function useSignup() {
  const startSession = useStartSession()
  return useMutation({ mutationFn: authApi.signup, onSuccess: startSession })
}

export function useLogout() {
  return useMutation({
    mutationFn: () => authApi.logout(),
    // The session ends locally even if the request fails.
    onSettled: () => setToken(null, 'logout'),
  })
}
