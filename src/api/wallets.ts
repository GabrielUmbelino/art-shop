import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import type { Network } from '@/contracts/common'
import {
  wallet,
  walletConnection,
  type WalletBody,
  type WalletUpdateBody,
} from '@/contracts/wallet'
import { http, parse } from './http'
import { privateKey } from './keys'

export const walletsKey = (userId: string) => privateKey(userId, 'wallets')

export const walletsQuery = (userId: string) =>
  queryOptions({
    queryKey: walletsKey(userId),
    queryFn: async ({ signal }) =>
      parse(z.array(wallet), (await http.get('/wallets', { signal })).data),
  })

export const walletsApi = {
  create: async (body: WalletBody) => parse(wallet, (await http.post('/wallets', body)).data),
  update: async (id: string, body: WalletUpdateBody) =>
    parse(wallet, (await http.patch(`/wallets/${id}`, body)).data),
  connect: async (id: string, network: Network) =>
    parse(walletConnection, (await http.post(`/wallets/${id}/connect`, { network })).data),
  disconnect: async (id: string) => {
    await http.delete(`/wallets/${id}/connection`)
  },
}
