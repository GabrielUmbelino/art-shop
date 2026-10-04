import { delay, http, HttpResponse } from 'msw'
import { createOrderBody } from '@/contracts/order'
import { mul } from '@/lib/money'
import { db, nextId, now, save, type CartRecord, type OrderRecord } from '../db/store'
import { changeEdition, computeQuote, lineInfo, scheduleOrder } from '../domain'
import { body, fail, fingerprint, requireUser } from '../lib'

const toOrder = ({ userId: _u, idempotencyKey: _k, fingerprint: _f, ...order }: OrderRecord) =>
  order

/** Scenario hooks that change the first cart item right before the order is validated. */
function applyCheckoutScenario(cart: CartRecord) {
  const first = cart.items[0]
  if (db.config.priceChangeOnOrder) {
    db.config.priceChangeOnOrder = false
    changeEdition(first.nftId, first.editionId, {
      price: mul(lineInfo(first).edition.price, '1.1'),
    })
  }
  if (db.config.soldOutOnOrder) {
    db.config.soldOutOnOrder = false
    changeEdition(first.nftId, first.editionId, { available: 0 })
  }
}

export const orderHandlers = [
  http.post('/api/orders', async ({ request }) => {
    const user = requireUser(request)
    const key = request.headers.get('Idempotency-Key')
    if (!key) fail('VALIDATION_ERROR', { message: 'Cabeçalho Idempotency-Key ausente' })
    const input = await body(request, createOrderBody)
    const requestFingerprint = fingerprint(input)

    const previous = db.orders.find((o) => o.userId === user.id && o.idempotencyKey === key)
    if (previous) {
      if (previous.fingerprint !== requestFingerprint) fail('IDEMPOTENCY_CONFLICT')
      return HttpResponse.json(toOrder(previous))
    }

    const cart = Object.values(db.carts).find((c) => c.userId === user.id)
    if (!cart?.items.length) fail('QUOTE_CHANGED', { message: 'Seu carrinho está vazio' })
    applyCheckoutScenario(cart)

    const quote = computeQuote(cart, input.network)
    if (!quote.valid || quote.id !== input.quoteId) fail('QUOTE_CHANGED', { details: { quote } })

    const wallet = db.wallets.find((w) => w.id === input.walletId && w.userId === user.id)
    if (!wallet) fail('NOT_FOUND', { message: 'Esta carteira não existe' })
    if (db.walletConnections[wallet.id]?.network !== input.network) fail('WALLET_NOT_CONNECTED')

    const timestamp = now()
    const order: OrderRecord = {
      id: nextId('order'),
      status: 'pending',
      lines: cart.items.map((item, i) => {
        const { nft, edition } = lineInfo(item)
        const line = quote.lines[i]
        return {
          nftId: nft.id,
          editionId: edition.id,
          name: nft.name,
          tokenId: nft.tokenId,
          editionName: edition.name,
          image: nft.image,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
        }
      }),
      coupon: quote.coupon,
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      network: input.network,
      wallet: {
        id: wallet.id,
        label: wallet.label,
        address: wallet.address,
        provider: input.provider,
      },
      collector: input.collector,
      txHash: null,
      explorerUrl: null,
      refusalReason: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1,
      userId: user.id,
      idempotencyKey: key,
      fingerprint: requestFingerprint,
    }
    db.orders.push(order)
    save()
    scheduleOrder(order.id)

    if (db.config.orderTimeoutOnce) {
      db.config.orderTimeoutOnce = false
      save()
      await delay('infinite')
    }
    return HttpResponse.json(toOrder(order), { status: 201 })
  }),

  http.get('/api/orders/:id', ({ request, params }) => {
    const user = requireUser(request)
    const order =
      db.orders.find((o) => o.id === params.id) ??
      fail('NOT_FOUND', { message: 'Este pedido não existe' })
    if (order.userId !== user.id) fail('FORBIDDEN')
    return HttpResponse.json(toOrder(order))
  }),
]
