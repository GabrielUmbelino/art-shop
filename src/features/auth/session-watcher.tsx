import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import type { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { sessionKey } from '@/api/auth'
import { privateRoot } from '@/api/keys'
import { getToken, subscribeToken } from '@/lib/session-store'
import { cartNotices } from '@/features/cart/notices-store'
import { connectRealtime, disconnectRealtime } from '@/realtime/socket'
import { bindRealtime } from '@/realtime/sync'

/**
 * Single place that reacts to session changes (login, logout, user switch, expiry):
 * drops the previous user's private cache, replaces the socket and, when the session expired
 * on a private page, sends the user to login with a way back.
 */
export function SessionWatcher() {
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    const bind = (socket: Socket) => bindRealtime(socket, queryClient)
    void connectRealtime(getToken(), bind)
    const unsubscribe = subscribeToken((reason) => {
      const token = getToken()
      queryClient.removeQueries({ queryKey: privateRoot })
      queryClient.removeQueries({ queryKey: ['cart'] })
      cartNotices.clear()
      void connectRealtime(token, bind)
      if (token) return

      queryClient.setQueryData(sessionKey, null)
      const { location, matches } = router.state
      const onPrivatePage = matches.some((m) => m.routeId === '/_authenticated')
      if (reason === 'logout') {
        if (onPrivatePage) void router.navigate({ to: '/' })
        return
      }
      toast.warning('Sua sessão expirou. Entre novamente para continuar.')
      if (onPrivatePage)
        void router.navigate({
          to: '/login',
          search: { redirect: location.href, reason: 'expired' },
        })
    })
    return () => {
      unsubscribe()
      disconnectRealtime()
    }
  }, [queryClient, router])

  return null
}
