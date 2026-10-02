import type { ErrorCode } from '@/contracts/common'

/** Latency in ms: fixed, a seeded random range, or a sequence cycled per route (out-of-order). */
export type Latency = number | { min: number; max: number } | { sequence: number[] }

export type Failure = {
  /** Prefix of "METHOD /path", e.g. "POST /api/favorites" or "GET /api/nfts". */
  match: string
  error: ErrorCode | 'NETWORK' | 'TIMEOUT'
  /** How many matching requests fail. Omit to fail all of them. */
  times?: number
}

export type MockConfig = {
  latency: Latency
  offline: boolean
  failures: Failure[]
  emptyCatalog: boolean
  sessionTtlMs: number
  /** How pending orders resolve. "manual" waits for __mock.resolveOrder(). */
  orderOutcome: 'confirmed' | 'refused' | 'manual'
  orderDelayMs: number
  /** Next order is created but its response hangs past the client timeout. */
  orderTimeoutOnce: boolean
  /** Next order attempt raises the price of the first cart item before validating. */
  priceChangeOnOrder: boolean
  /** Next order attempt sells out the first cart item before validating. */
  soldOutOnOrder: boolean
  walletRejects: boolean
  /** New socket connections are closed immediately. */
  socketOffline: boolean
}

const base: MockConfig = {
  latency: { min: 150, max: 400 },
  offline: false,
  failures: [],
  emptyCatalog: false,
  sessionTtlMs: 30 * 60_000,
  orderOutcome: 'confirmed',
  orderDelayMs: 2_000,
  orderTimeoutOnce: false,
  priceChangeOnOrder: false,
  soldOutOnOrder: false,
  walletRejects: false,
  socketOffline: false,
}

export const scenarios = {
  default: { description: 'Realistic latency, everything succeeds', config: base },
  fast: { description: 'No latency, for automated tests', config: { ...base, latency: 0 } },
  empty: { description: 'Catalog without NFTs', config: { ...base, emptyCatalog: true } },
  slow: { description: 'Every request takes 2.5 s', config: { ...base, latency: 2_500 } },
  'variable-latency': {
    description: 'Latency between 200 ms and 2.5 s',
    config: { ...base, latency: { min: 200, max: 2_500 } },
  },
  'out-of-order': {
    description: 'Alternating slow and fast responses per route, so later requests resolve first',
    config: { ...base, latency: { sequence: [1_500, 100] } },
  },
  offline: {
    description: 'Every API request fails with a network error',
    config: { ...base, offline: true },
  },
  'server-error': {
    description: 'Every API request fails with 503',
    config: { ...base, failures: [{ match: '', error: 'TRANSIENT' }] },
  },
  flaky: {
    description: 'The first catalog request and the first favorite toggle fail, retries succeed',
    config: {
      ...base,
      failures: [
        { match: 'GET /api/nfts', error: 'TRANSIENT', times: 1 },
        { match: 'PUT /api/favorites', error: 'TRANSIENT', times: 1 },
      ],
    },
  },
  'session-expiry': {
    description: 'Sessions expire one minute after login',
    config: { ...base, sessionTtlMs: 60_000 },
  },
  'price-change': {
    description: 'The price of the first cart item rises when the order is submitted',
    config: { ...base, priceChangeOnOrder: true },
  },
  'sold-out': {
    description: 'The first cart item sells out when the order is submitted',
    config: { ...base, soldOutOnOrder: true },
  },
  'order-timeout': {
    description: 'The first order is created but its response times out; a retry recovers it',
    config: { ...base, orderTimeoutOnce: true },
  },
  'payment-refused': {
    description: 'Orders are refused after payment',
    config: { ...base, orderOutcome: 'refused' },
  },
  'wallet-rejected': {
    description: 'Wallet connection requests are rejected',
    config: { ...base, walletRejects: true },
  },
} satisfies Record<string, { description: string; config: MockConfig }>

export type ScenarioName = keyof typeof scenarios

export const isScenario = (name: string): name is ScenarioName => name in scenarios
