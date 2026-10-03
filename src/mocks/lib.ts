import { HttpResponse } from 'msw'
import type { z } from 'zod'
import { errorStatus, type ApiErrorBody, type ErrorCode } from '@/contracts/common'
import { db, type UserRecord } from './db/store'

const defaultMessages: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Alguns campos estão inválidos',
  UNAUTHENTICATED: 'Entre para continuar',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente',
  FORBIDDEN: 'Você não tem acesso a este recurso',
  NOT_FOUND: 'Não encontrado',
  CONFLICT: 'Conflito com dados existentes',
  OUT_OF_STOCK: 'Quantidade indisponível',
  QUOTE_CHANGED: 'Preços ou disponibilidade mudaram. Revise seu pedido',
  IDEMPOTENCY_CONFLICT: 'Esta chave de idempotência já foi usada em outra requisição',
  COUPON_INVALID: 'Este código promocional não existe',
  COUPON_EXPIRED: 'Este código promocional expirou',
  WALLET_REJECTED: 'A carteira recusou a conexão',
  WALLET_NOT_CONNECTED: 'Conecte sua carteira na rede selecionada',
  TRANSIENT: 'Serviço temporariamente indisponível. Tente novamente',
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
