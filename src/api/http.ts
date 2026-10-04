import axios, { AxiosError } from 'axios'
import { apiError, type ApiErrorBody, type ErrorCode } from '@/contracts/common'
import { getGuestCartId } from '@/lib/guest-cart'
import { getToken, setToken } from '@/lib/session-store'

export type ClientErrorCode = ErrorCode | 'NETWORK' | 'TIMEOUT'

/** Every failed request becomes an ApiError with a code the UI can switch on. */
export class ApiError extends Error {
  readonly code: ClientErrorCode
  readonly status: number | null
  readonly fieldErrors: Record<string, string>
  readonly details: unknown

  constructor(code: ClientErrorCode, message: string, status: number | null, body?: ApiErrorBody) {
    super(message)
    this.code = code
    this.status = status
    this.fieldErrors = body?.fieldErrors ?? {}
    this.details = body?.details
  }
}

/** Errors worth retrying: the server said so, or the request never got an answer. */
export const isRetryable = (error: unknown) =>
  error instanceof ApiError && ['TRANSIENT', 'NETWORK', 'TIMEOUT'].includes(error.code)

export const http = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  // Arrays as repeated keys: category=art&category=music.
  paramsSerializer: { indexes: null },
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Ignored by the API for signed-in users, who always get their own cart.
  const cartId = getGuestCartId()
  if (cartId) config.headers['X-Cart-Id'] = cartId
  return config
})

http.interceptors.response.use(undefined, (error: AxiosError) => {
  if (axios.isCancel(error)) throw error
  if (!error.response) {
    throw error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      ? new ApiError('TIMEOUT', 'A requisição demorou demais. Tente novamente.', null)
      : new ApiError('NETWORK', 'Sem conexão com o servidor. Verifique sua internet.', null)
  }
  const parsed = apiError.safeParse(error.response.data)
  const body = parsed.success ? parsed.data : undefined
  const apiErr = new ApiError(
    body?.code ?? 'TRANSIENT',
    body?.message ?? 'Algo deu errado. Tente novamente.',
    error.response.status,
    body,
  )
  // A rejected token ends the session; the app shell reacts to the change.
  if (error.response.status === 401 && getToken()) {
    setToken(null, apiErr.code === 'SESSION_EXPIRED' ? 'expired' : 'unauthenticated')
  }
  throw apiErr
})
