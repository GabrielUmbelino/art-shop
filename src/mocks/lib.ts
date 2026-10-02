import { HttpResponse } from 'msw'
import type { z } from 'zod'
import { errorStatus, type ApiErrorBody, type ErrorCode } from '@/contracts/common'
import { db, type UserRecord } from './db/store'

const defaultMessages: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Some fields are invalid',
  UNAUTHENTICATED: 'Sign in to continue',
  SESSION_EXPIRED: 'Your session has expired. Sign in again',
  FORBIDDEN: 'You do not have access to this resource',
  NOT_FOUND: 'Not found',
  CONFLICT: 'This conflicts with existing data',
  OUT_OF_STOCK: 'Not enough units available',
  QUOTE_CHANGED: 'Prices or availability changed. Review your order',
  IDEMPOTENCY_CONFLICT: 'This idempotency key was already used for a different request',
  COUPON_INVALID: 'This coupon code does not exist',
  COUPON_EXPIRED: 'This coupon has expired',
  WALLET_REJECTED: 'The wallet rejected the connection request',
  WALLET_NOT_CONNECTED: 'Connect your wallet on the selected network',
  TRANSIENT: 'Service temporarily unavailable. Try again',
}

export function apiError(code: ErrorCode, extra: Partial<Omit<ApiErrorBody, 'code'>> = {}) {
  const body: ApiErrorBody = { code, message: defaultMessages[code], ...extra }
  return HttpResponse.json(body, { status: errorStatus[code] })
}

/** Handlers throw responses to stop early; MSW uses a thrown Response as the mocked response. */
export function fail(code: ErrorCode, extra?: Partial<Omit<ApiErrorBody, 'code'>>): never {
  throw apiError(code, extra)
}

export function validate<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input)
  if (result.success) return result.data
  const fieldErrors: Record<string, string> = {}
  for (const issue of result.error.issues) fieldErrors[issue.path.join('.')] ??= issue.message
  return fail('VALIDATION_ERROR', { fieldErrors })
}

export async function body<T extends z.ZodType>(request: Request, schema: T) {
  return validate(schema, await request.json().catch(() => null))
}

function bearer(request: Request) {
  return request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? null
}

/** Returns the session user, null when anonymous, or throws SESSION_EXPIRED. */
export function optionalUser(request: Request): UserRecord | null {
  const token = bearer(request)
  if (!token) return null
  const session = db.sessions.find((s) => s.token === token)
  if (!session) return fail('UNAUTHENTICATED')
  if (Date.parse(session.expiresAt) <= Date.now()) return fail('SESSION_EXPIRED')
  return db.users.find((u) => u.id === session.userId) ?? fail('UNAUTHENTICATED')
}

export function requireUser(request: Request): UserRecord {
  return optionalUser(request) ?? fail('UNAUTHENTICATED')
}

/** User for a token if its session is still valid, used to scope socket events. */
export function userIdForToken(token: string | null) {
  const session = token ? db.sessions.find((s) => s.token === token) : undefined
  return session && Date.parse(session.expiresAt) > Date.now() ? session.userId : null
}

export async function hashPassword(salt: string, password: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}:${password}`),
  )
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Small deterministic string hash (FNV-1a), used for quote ids and request fingerprints. */
export function fingerprint(value: unknown) {
  let hash = 0x811c9dc5
  for (const char of JSON.stringify(value)) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
