import { z } from 'zod'
import { ethAmount, isoDate, network } from './common'
import { walletProvider } from './wallet'

export const orderStatus = z.enum(['pending', 'confirmed', 'refused'])
export type OrderStatus = z.infer<typeof orderStatus>

const ens = /^[a-z0-9-]{3,32}\.eth$/
const address = /^0x[a-fA-F0-9]{40}$/

/** Collector profile from the payment layout. Required fields follow the design's asterisks. */
export const collector = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição'),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,20}$/, 'Use de 3 a 20 letras minúsculas, números ou _'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil'),
  email: z.email('Informe um e-mail válido'),
  ensName: z.string().trim().regex(ens, 'Use um nome ENS válido, como nome.eth'),
  referralCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4,12}$/, 'Use de 4 a 12 letras ou números'),
  /** ENS name or 0x address of a secondary wallet. */
  secondaryAddress: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || ens.test(v) || address.test(v),
      'Use um nome ENS ou um endereço 0x válido',
    )
    .optional(),
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
