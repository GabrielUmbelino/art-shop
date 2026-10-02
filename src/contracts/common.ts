import { z } from 'zod'

/** ETH amount as a decimal string, up to 18 decimals. Never a number. */
export const ethAmount = z.string().regex(/^\d+(\.\d{1,18})?$/, 'Invalid ETH amount')

export const isoDate = z.iso.datetime()

export const errorCode = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'OUT_OF_STOCK',
  'QUOTE_CHANGED',
  'IDEMPOTENCY_CONFLICT',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'WALLET_REJECTED',
  'WALLET_NOT_CONNECTED',
  'TRANSIENT',
])
export type ErrorCode = z.infer<typeof errorCode>

export const apiError = z.object({
  code: errorCode,
  message: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
  details: z.unknown().optional(),
})
export type ApiErrorBody = z.infer<typeof apiError>

export const errorStatus: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  COUPON_INVALID: 422,
  COUPON_EXPIRED: 422,
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  OUT_OF_STOCK: 409,
  QUOTE_CHANGED: 409,
  IDEMPOTENCY_CONFLICT: 409,
  WALLET_REJECTED: 409,
  WALLET_NOT_CONNECTED: 409,
  TRANSIENT: 503,
}

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
