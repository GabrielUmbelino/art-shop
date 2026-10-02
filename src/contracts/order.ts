import { z } from 'zod'
import { ethAmount, isoDate } from './common'
import { network } from './cart'

export const orderStatus = z.enum(['pending', 'confirmed', 'refused'])
export type OrderStatus = z.infer<typeof orderStatus>

export const collector = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  email: z.email('Enter a valid email'),
})

export const createOrderBody = z.object({
  quoteId: z.string(),
  network,
  walletId: z.string(),
  collector,
})
export type CreateOrderBody = z.infer<typeof createOrderBody>

/** Snapshot of what was bought. Never changes after creation. */
export const orderLine = z.object({
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  editionName: z.string(),
  image: z.string(),
  unitPrice: ethAmount,
  quantity: z.number().int().min(1),
  lineTotal: ethAmount,
})

export const order = z.object({
  id: z.string(),
  status: orderStatus,
  lines: z.array(orderLine),
  coupon: z.object({ code: z.string(), percentOff: z.number() }).nullable(),
  subtotal: ethAmount,
  discount: ethAmount,
  networkFee: ethAmount,
  total: ethAmount,
  network,
  wallet: z.object({ id: z.string(), label: z.string(), address: z.string() }),
  collector,
  txHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  refusalReason: z.string().nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
  version: z.number().int().min(1),
})
export type Order = z.infer<typeof order>
