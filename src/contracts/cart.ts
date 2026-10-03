import { z } from 'zod'
import { ethAmount } from './common'

export const networks = ['ethereum', 'polygon', 'base'] as const
export const network = z.enum(networks)
export type Network = z.infer<typeof network>

export const networkInfo = z.object({ id: network, name: z.string(), fee: ethAmount })
export type NetworkInfo = z.infer<typeof networkInfo>

export const cartItem = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  editionName: z.string(),
  image: z.string(),
  unitPrice: ethAmount,
  quantity: z.number().int().min(1),
  /** Upper bound for quantity: min(edition availability, maxPerOrder). */
  maxQuantity: z.number().int().min(0),
})
export type CartItem = z.infer<typeof cartItem>

export const cart = z.object({
  id: z.string(),
  items: z.array(cartItem),
  couponCode: z.string().nullable(),
})
export type Cart = z.infer<typeof cart>

export const addCartItemBody = z.object({
  nftId: z.string(),
  editionId: z.string(),
  quantity: z.number().int().min(1),
})
export type AddCartItemBody = z.infer<typeof addCartItemBody>

export const updateCartItemBody = z.object({ quantity: z.number().int().min(1) })

export const applyCouponBody = z.object({
  code: z.string().trim().min(1, 'Informe um código promocional'),
})

export const mergeCartBody = z.object({ guestCartId: z.string() })

export const quoteIssue = z.enum(['sold-out', 'insufficient-stock'])

export const quoteLine = z.object({
  itemId: z.string(),
  unitPrice: ethAmount,
  quantity: z.number().int().min(1),
  lineTotal: ethAmount,
  available: z.number().int().min(0),
  issue: quoteIssue.nullable(),
})

export const quote = z.object({
  /** Fingerprint of every value below. Changes whenever any of them changes. */
  id: z.string(),
  network,
  lines: z.array(quoteLine),
  coupon: z.object({ code: z.string(), percentOff: z.number() }).nullable(),
  subtotal: ethAmount,
  discount: ethAmount,
  networkFee: ethAmount,
  total: ethAmount,
  /** False when any line has an issue; such a quote cannot be ordered. */
  valid: z.boolean(),
})
export type Quote = z.infer<typeof quote>
