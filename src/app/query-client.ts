import { QueryClient } from '@tanstack/react-query'
import { isRetryable } from '@/api/http'

/**
 * Cache policy (documented in ARCHITECTURE.md):
 * - data is fresh for 30 s, then refetched in the background on mount, focus or reconnect;
 * - queries retry up to twice, only on transient failures (503, network, timeout), never on 4xx;
 * - mutations never retry automatically: each one decides how to recover (e.g. idempotency keys).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
    },
    mutations: { retry: false },
  },
})
