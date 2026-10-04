import { z } from 'zod'
import { isoDate, network } from './common'
import {
  displayName,
  email,
  ensName,
  nickname,
  referralCode,
  secondaryAddress,
  walletAddress,
} from './fields'

export const walletSlot = z.enum(['primary', 'secondary'])
export const walletProvider = z.enum(['metamask', 'coinbase', 'walletconnect'])

/**
 * A saved wallet with the collector profile used to pay with it (fields of the wallets layout).
 * Checkout prefills its form from the selected wallet.
 */
const walletFields = {
  /** "Apelido da carteira". */
  label: nickname,
  /** "Tipo de carteira". */
  provider: walletProvider,
  address: walletAddress,
  network,
  displayName,
  profileName: displayName,
  email,
  ensName,
  referralCode,
  secondaryAddress,
}

export const wallet = z.object({
  id: z.string(),
  slot: walletSlot,
  ...walletFields,
  updatedAt: isoDate,
})
export type Wallet = z.infer<typeof wallet>

export const walletBody = z.object({ slot: walletSlot, ...walletFields })
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
