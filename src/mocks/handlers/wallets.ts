import { http, HttpResponse } from 'msw'
import {
  connectWalletBody,
  walletBody,
  walletUpdateBody,
  type Wallet,
  type WalletConnection,
} from '@/contracts/wallet'
import { db, nextId, now, save, type WalletRecord } from '../db/store'
import { body, fail, requireUser } from '../lib'

const toWallet = ({ userId: _u, ...wallet }: WalletRecord): Wallet => wallet

function ownWallet(request: Request, id: string) {
  const user = requireUser(request)
  const wallet =
    db.wallets.find((w) => w.id === id) ??
    fail('NOT_FOUND', { message: 'This wallet does not exist' })
  if (wallet.userId !== user.id) fail('FORBIDDEN')
  return wallet
}

function duplicateAddress(userId: string, address: string | undefined, exceptId?: string) {
  return (
    !!address &&
    db.wallets.some(
      (w) =>
        w.userId === userId &&
        w.id !== exceptId &&
        w.address.toLowerCase() === address.toLowerCase(),
    )
  )
}

export const walletHandlers = [
  http.get('/api/wallets', ({ request }) => {
    const user = requireUser(request)
    return HttpResponse.json(db.wallets.filter((w) => w.userId === user.id).map(toWallet))
  }),

  http.post('/api/wallets', async ({ request }) => {
    const user = requireUser(request)
    const input = await body(request, walletBody)
    if (db.wallets.some((w) => w.userId === user.id && w.slot === input.slot))
      fail('CONFLICT', { fieldErrors: { slot: `You already have a ${input.slot} wallet` } })
    if (duplicateAddress(user.id, input.address))
      fail('CONFLICT', { fieldErrors: { address: 'This address is already registered' } })
    const wallet: WalletRecord = {
      id: nextId('wallet'),
      userId: user.id,
      ...input,
      updatedAt: now(),
    }
    db.wallets.push(wallet)
    save()
    return HttpResponse.json(toWallet(wallet), { status: 201 })
  }),

  http.patch('/api/wallets/:id', async ({ request, params }) => {
    const wallet = ownWallet(request, params.id as string)
    const input = await body(request, walletUpdateBody)
    if (duplicateAddress(wallet.userId, input.address, wallet.id))
      fail('CONFLICT', { fieldErrors: { address: 'This address is already registered' } })
    Object.assign(wallet, input, { updatedAt: now() })
    if (input.address) delete db.walletConnections[wallet.id]
    save()
    return HttpResponse.json(toWallet(wallet))
  }),

  /** Simulated wallet connection on a network; rejected when the scenario says so. */
  http.post('/api/wallets/:id/connect', async ({ request, params }) => {
    const wallet = ownWallet(request, params.id as string)
    const { network } = await body(request, connectWalletBody)
    if (db.config.walletRejects) fail('WALLET_REJECTED')
    const connection = { network, connectedAt: now() }
    db.walletConnections[wallet.id] = connection
    save()
    return HttpResponse.json<WalletConnection>({ walletId: wallet.id, ...connection })
  }),

  http.delete('/api/wallets/:id/connection', ({ request, params }) => {
    const wallet = ownWallet(request, params.id as string)
    delete db.walletConnections[wallet.id]
    save()
    return new HttpResponse(null, { status: 204 })
  }),
]
