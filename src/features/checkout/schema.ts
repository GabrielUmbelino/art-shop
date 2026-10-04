import { z } from 'zod'
import { network } from '@/contracts/common'
import { collector } from '@/contracts/order'
import { walletProvider } from '@/contracts/wallet'

export const checkoutForm = z.object({
  collector,
  walletId: z.string().min(1, 'Selecione uma carteira'),
  provider: walletProvider,
  network,
})
export type CheckoutForm = z.infer<typeof checkoutForm>

export const providerLabels: Record<CheckoutForm['provider'], string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}
