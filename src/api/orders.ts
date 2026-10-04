import { queryOptions } from '@tanstack/react-query'
import axios from 'axios'
import { order, type CreateOrderBody } from '@/contracts/order'
import { ApiError, http } from './http'
import { privateKey } from './keys'

export const orderKey = (userId: string, id: string) => privateKey(userId, 'orders', id)

export const orderQuery = (userId: string, id: string) =>
  queryOptions({
    queryKey: orderKey(userId, id),
    queryFn: async ({ signal }) => order.parse((await http.get(`/orders/${id}`, { signal })).data),
  })

/** Long enough for a slow API, short enough to recover quickly from a lost response. */
export const ORDER_TIMEOUT_MS = 6_000

export const ordersApi = {
  /**
   * The timer is a plain setTimeout (not XHR's timeout) so tests can control it with a fake clock.
   * Retrying with the same idempotency key returns the order created by the first attempt.
   */
  create: async (body: CreateOrderBody, idempotencyKey: string) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ORDER_TIMEOUT_MS)
    try {
      const { data } = await http.post('/orders', body, {
        headers: { 'Idempotency-Key': idempotencyKey },
        signal: controller.signal,
        timeout: 0,
      })
      return order.parse(data)
    } catch (error) {
      if (axios.isCancel(error))
        throw new ApiError('TIMEOUT', 'A confirmação do pedido está demorando.', null)
      throw error
    } finally {
      clearTimeout(timer)
    }
  },
}
