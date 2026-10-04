import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { cart, networkInfo, quote, type AddCartItemBody } from '@/contracts/cart'
import type { Network } from '@/contracts/common'
import { getToken } from '@/lib/session-store'
import { getGuestCartId, setGuestCartId } from '@/lib/guest-cart'
import { http } from './http'
import { privateKey } from './keys'

/** Signed-in carts are private data; the guest cart lives under its own key. */
export const cartKey = (userId: string | null) =>
  userId ? privateKey(userId, 'cart') : (['cart', 'guest'] as const)
export const quoteKey = (userId: string | null, network: Network) =>
  [...cartKey(userId), 'quote', network] as const

const parseCart = (data: unknown) => {
  const parsed = cart.parse(data)
  // The first guest request creates the cart; remember it for the next visits.
  if (!getToken() && parsed.id !== getGuestCartId()) setGuestCartId(parsed.id)
  return parsed
}

export const cartQuery = (userId: string | null) =>
  queryOptions({
    queryKey: cartKey(userId),
    queryFn: async ({ signal }) => parseCart((await http.get('/cart', { signal })).data),
  })

export const quoteQuery = (userId: string | null, network: Network) =>
  queryOptions({
    queryKey: quoteKey(userId, network),
    queryFn: async ({ signal }) =>
      quote.parse((await http.get('/cart/quote', { params: { network }, signal })).data),
  })

export const networksQuery = queryOptions({
  queryKey: ['networks'],
  queryFn: async ({ signal }) =>
    z.array(networkInfo).parse((await http.get('/networks', { signal })).data),
  staleTime: Infinity,
})

export const cartApi = {
  add: async (body: AddCartItemBody) => parseCart((await http.post('/cart/items', body)).data),
  setQuantity: async (itemId: string, quantity: number) =>
    parseCart((await http.patch(`/cart/items/${itemId}`, { quantity })).data),
  remove: async (itemId: string) => parseCart((await http.delete(`/cart/items/${itemId}`)).data),
  applyCoupon: async (code: string) => parseCart((await http.put('/cart/coupon', { code })).data),
  removeCoupon: async () => parseCart((await http.delete('/cart/coupon')).data),
  merge: async (guestCartId: string) =>
    cart.parse((await http.post('/cart/merge', { guestCartId })).data),
}
