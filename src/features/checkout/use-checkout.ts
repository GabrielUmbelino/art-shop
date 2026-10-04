import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { quoteQuery } from '@/api/cart'
import { ApiError } from '@/api/http'
import { ordersApi } from '@/api/orders'
import { walletsApi, walletsQuery } from '@/api/wallets'
import type { Network } from '@/contracts/common'
import type { Quote } from '@/contracts/cart'
import type { CreateOrderBody } from '@/contracts/order'
import { useSession } from '@/features/auth/use-auth'
import { idempotencyKeyFor } from './draft'

export function useUserId() {
  return useSession()?.user.id ?? ''
}

export function useWallets() {
  const userId = useUserId()
  return useQuery({ ...walletsQuery(userId), enabled: !!userId })
}

export type Connection =
  | { status: 'idle' | 'connecting' }
  | { status: 'connected'; walletId: string; network: Network }
  | { status: 'rejected'; message: string }

/** Simulated wallet connection: the API approves, rejects (scenario) or drops it on disconnect. */
export function useWalletConnection() {
  const [connection, setConnection] = useState<Connection>({ status: 'idle' })
  const connect = async (walletId: string, network: Network) => {
    setConnection({ status: 'connecting' })
    try {
      await walletsApi.connect(walletId, network)
      setConnection({ status: 'connected', walletId, network })
    } catch (error) {
      setConnection({
        status: 'rejected',
        message:
          error instanceof ApiError ? error.message : 'Não foi possível conectar a carteira.',
      })
    }
  }
  const disconnect = async (walletId: string) => {
    await walletsApi.disconnect(walletId).catch(() => undefined)
    setConnection({ status: 'idle' })
  }
  return { connection, connect, disconnect, reset: () => setConnection({ status: 'idle' }) }
}

/** Always asks the API for the current quote (no cache), used right before confirming. */
export function useFreshQuote() {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return (network: Network) =>
    queryClient.fetchQuery({ ...quoteQuery(userId, network), staleTime: 0 })
}

/**
 * Creates the order. Lost responses (timeout, network) are retried with the same idempotency key,
 * so the API returns the order created by the first attempt instead of a second purchase.
 */
export function useSubmitOrder(onRetry: () => void) {
  const userId = useUserId()
  return useMutation({
    mutationFn: async (body: CreateOrderBody) => {
      const key = idempotencyKeyFor(userId, body)
      for (let attempt = 0; ; attempt++) {
        try {
          return await ordersApi.create(body, key)
        } catch (error) {
          const lost =
            error instanceof ApiError && ['TIMEOUT', 'NETWORK', 'TRANSIENT'].includes(error.code)
          if (!lost || attempt >= 2) throw error
          onRetry()
        }
      }
    },
  })
}

/** The new quote sent with a QUOTE_CHANGED error, if any. */
export const changedQuote = (error: unknown) =>
  error instanceof ApiError && error.code === 'QUOTE_CHANGED'
    ? ((error.details as { quote?: Quote } | undefined)?.quote ?? null)
    : null
