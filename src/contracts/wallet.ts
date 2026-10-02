import { z } from 'zod'
import { isoDate } from './common'
import { network } from './cart'

export const walletSlot = z.enum(['primary', 'secondary'])
export const walletProvider = z.enum(['metamask', 'coinbase', 'walletconnect'])

export const wallet = z.object({
  id: z.string(),
  slot: walletSlot,
  label: z.string(),
  provider: walletProvider,
  address: z.string(),
  updatedAt: isoDate,
})
export type Wallet = z.infer<typeof wallet>

export const walletBody = z.object({
  slot: walletSlot,
  label: z.string().trim().min(1, 'Enter a label').max(40, 'Keep it under 40 characters'),
  provider: walletProvider,
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Enter a valid address (0x followed by 40 hex characters)'),
})
export type WalletBody = z.infer<typeof walletBody>

export const walletUpdateBody = walletBody.omit({ slot: true }).partial()
export type WalletUpdateBody = z.infer<typeof walletUpdateBody>

export const connectWalletBody = z.object({ network })

export const walletConnection = z.object({
  walletId: z.string(),
  network,
  connectedAt: isoDate,
})
export type WalletConnection = z.infer<typeof walletConnection>
