import type { Network } from '@/contracts/common'
import type { Collector, CreateOrderBody } from '@/contracts/order'
import type { Wallet } from '@/contracts/wallet'

/**
 * Checkout state kept per user in localStorage: the form (so a refresh or an expired session does
 * not lose it) and the current attempt's idempotency key, reused while the request is unchanged.
 */
export type CheckoutDraft = {
  collector?: Partial<Collector>
  walletId?: string
  provider?: Wallet['provider']
  network?: Network
  attempt?: { body: string; key: string }
}

const storageKey = (userId: string) => `kurio:checkout:${userId}`

export function loadDraft(userId: string): CheckoutDraft {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? '{}') as CheckoutDraft
  } catch {
    return {}
  }
}

export function saveDraft(userId: string, patch: Partial<CheckoutDraft>) {
  localStorage.setItem(storageKey(userId), JSON.stringify({ ...loadDraft(userId), ...patch }))
}

export const clearDraft = (userId: string) => localStorage.removeItem(storageKey(userId))

/** Same body as the last attempt: same key, so the API returns the same order instead of a new one. */
export function idempotencyKeyFor(userId: string, body: CreateOrderBody) {
  const serialized = JSON.stringify(body)
  const { attempt } = loadDraft(userId)
  if (attempt?.body === serialized) return attempt.key
  const key = crypto.randomUUID()
  saveDraft(userId, { attempt: { body: serialized, key } })
  return key
}
