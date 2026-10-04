import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import type { Network } from '@/contracts/common'
import { wallet, walletConnection, type WalletBody, type WalletUpdateBody } from '@/contracts/wallet'
import { http } from './http'
import { privateKey } from './keys'

export const walletsKey = (userId: string) => privateKey(userId, 'wallets')

export const walletsQuery = (userId: string) =>
  queryOptions({
    queryKey: walletsKey(userId),
    queryFn: async ({ signal }) => z.array(wallet).parse((await http.get('/wallets', { signal })).data),
  })

export const walletsApi = {
  create: async (body: WalletBody) => wallet.parse((await http.post('/wallets', body)).data),
  update: async (id: string, body: WalletUpdateBody) => wallet.parse((await http.patch(`/wallets/${id}`, body)).data),
  connect: async (id: string, network: Network) =>
    walletConnection.parse((await http.post(`/wallets/${id}/connect`, { network })).data),
  disconnect: async (id: string) => {
    await http.delete(`/wallets/${id}/connection`)
  },
}
