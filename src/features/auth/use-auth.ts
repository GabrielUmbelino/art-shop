import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authApi, sessionKey, sessionQuery } from '@/api/auth'
import { cartApi } from '@/api/cart'
import type { Session } from '@/contracts/user'
import { clearGuestCartId, getGuestCartId } from '@/lib/guest-cart'
import { setToken } from '@/lib/session-store'

export const useSession = () => useQuery(sessionQuery).data ?? null

/**
 * Storing the token notifies the session watcher, which clears the previous user's private data.
 * A guest cart is then merged into the user's cart, so items added before signing in are kept.
 */
function useStartSession() {
  const queryClient = useQueryClient()
  return async (session: Session) => {
    setToken(session.token)
    queryClient.setQueryData(sessionKey, session)
    const guestCartId = getGuestCartId()
    if (!guestCartId) return
    try {
      await cartApi.merge(guestCartId)
      clearGuestCartId()
    } catch {
      toast.error('Não foi possível recuperar os itens do seu carrinho de visitante.')
    }
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
