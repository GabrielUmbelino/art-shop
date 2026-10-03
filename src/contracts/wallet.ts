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
  label: z.string().trim().min(1, 'Informe um apelido').max(40, 'Use no máximo 40 caracteres'),
  provider: walletProvider,
  address: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      'Informe um endereço válido (0x seguido de 40 caracteres hexadecimais)',
    ),
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
