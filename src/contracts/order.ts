import { z } from 'zod'
import { ethAmount, isoDate, network } from './common'
import { displayName, email, ensName, referralCode, secondaryAddress, username } from './fields'
import { walletProvider } from './wallet'

export const orderStatus = z.enum(['pending', 'confirmed', 'refused'])
export type OrderStatus = z.infer<typeof orderStatus>

/** Collector profile from the payment layout. Required fields follow the design's asterisks. */
export const collector = z.object({
  displayName,
  username,
  profileName: displayName,
  email,
  ensName,
  referralCode,
  secondaryAddress: secondaryAddress.optional(),
  note: z.string().trim().max(280, 'Use no máximo 280 caracteres').optional(),
})
export type Collector = z.infer<typeof collector>

export const createOrderBody = z.object({
  quoteId: z.string(),
  network,
  walletId: z.string(),
  /** Wallet app used to approve the payment ("Carteira e rede"). */
  provider: walletProvider,
  collector,
})
export type CreateOrderBody = z.infer<typeof createOrderBody>

/** Snapshot of what was bought. Never changes after creation. */
export const orderLine = z.object({
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  tokenId: z.string(),
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
  wallet: z.object({
    id: z.string(),
    label: z.string(),
    address: z.string(),
    provider: walletProvider,
  }),
  collector,
  txHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  refusalReason: z.string().nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
  version: z.number().int().min(1),
})
export type Order = z.infer<typeof order>
