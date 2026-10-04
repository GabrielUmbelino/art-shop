import type { Cart, Quote } from '@/contracts/cart'
import type { Network } from '@/contracts/common'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/events'
import type { Edition } from '@/contracts/nft'
import { add, mul, percentOf, sub } from '@/lib/money'
import { db, findNft, now, save, toNft, type CartRecord, type OrderRecord } from './db/store'
import { fingerprint } from './lib'
import { publish } from './socket'

/** Every NFT change goes through here, so REST and nft.updated never diverge. */
export function changeEdition(
  nftId: string,
  editionId: string,
  patch: Partial<Pick<Edition, 'price' | 'available'>>,
) {
  const record = findNft(nftId)
  const edition = record?.editions.find((e) => e.id === editionId)
  if (!record || !edition) return
  Object.assign(edition, patch)
  record.version += 1
  save()
  const payload = toNft(record)
  publish<NftUpdatedEvent>({
    type: 'nft.updated',
    resourceId: record.id,
    version: record.version,
    payload,
  })
}

export function lineInfo(item: CartRecord['items'][number]) {
  const nft = findNft(item.nftId)!
  const edition = nft.editions.find((e) => e.id === item.editionId)!
  return { nft, edition, maxQuantity: Math.min(edition.available, nft.maxPerOrder) }
}

export function toCart(record: CartRecord): Cart {
  return {
    id: record.id,
    couponCode: record.couponCode,
    items: record.items.map((item) => {
      const { nft, edition, maxQuantity } = lineInfo(item)
      return {
        ...item,
        name: nft.name,
        editionName: edition.name,
        image: nft.image,
        unitPrice: edition.price,
        maxQuantity,
      }
    }),
  }
}

export function activeCoupon(code: string | null) {
  const coupon = code ? db.coupons.find((c) => c.code === code) : undefined
  return coupon && Date.parse(coupon.expiresAt) > Date.now() ? coupon : null
}

export function computeQuote(cart: CartRecord, network: Network): Quote {
  const lines = cart.items.map((item) => {
    const { edition } = lineInfo(item)
    const issue =
      edition.available === 0
        ? 'sold-out'
        : item.quantity > edition.available
          ? 'insufficient-stock'
          : null
    return {
      itemId: item.id,
      unitPrice: edition.price,
      quantity: item.quantity,
      lineTotal: mul(edition.price, item.quantity),
      available: edition.available,
      issue,
    } as const
  })
  const coupon = activeCoupon(cart.couponCode)
  const subtotal = add('0', ...lines.map((l) => l.lineTotal))
  const discount = coupon ? percentOf(subtotal, coupon.percentOff) : '0'
  const networkFee = lines.length ? db.networks.find((n) => n.id === network)!.fee : '0'
  const values = {
    network,
    lines,
    coupon: coupon && { code: coupon.code, percentOff: coupon.percentOff },
    subtotal,
    discount,
    networkFee,
    total: add(sub(subtotal, discount), networkFee),
    valid: lines.length > 0 && lines.every((l) => l.issue === null),
  }
  return { id: `q_${fingerprint(values)}`, ...values }
}

const explorers: Record<Network, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}

function publishOrder(order: OrderRecord) {
  const { userId, idempotencyKey: _key, fingerprint: _fp, ...payload } = order
  publish<OrderUpdatedEvent>(
    { type: 'order.updated', resourceId: order.id, version: order.version, payload },
    userId,
  )
}

/** Settles a pending order. Confirmation consumes stock and removes the bought units from the cart. */
export function resolveOrder(orderId: string, outcome: 'confirmed' | 'refused') {
  const order = db.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'pending') return

  const soldOut = order.lines.some((line) => {
    const edition = findNft(line.nftId)?.editions.find((e) => e.id === line.editionId)
    return !edition || edition.available < line.quantity
  })
  if (outcome === 'refused' || soldOut) {
    order.status = 'refused'
    order.refusalReason = soldOut
      ? 'Uma edição esgotou antes da confirmação do pagamento'
      : 'O pagamento foi recusado pela carteira'
  } else {
    for (const line of order.lines) {
      const edition = findNft(line.nftId)!.editions.find((e) => e.id === line.editionId)!
      changeEdition(line.nftId, line.editionId, { available: edition.available - line.quantity })
    }
    const cart = Object.values(db.carts).find((c) => c.userId === order.userId)
    if (cart) {
      for (const line of order.lines) {
        const item = cart.items.find((i) => i.editionId === line.editionId)
        if (item) item.quantity -= line.quantity
      }
      cart.items = cart.items.filter((i) => i.quantity > 0)
    }
    order.status = 'confirmed'
    order.txHash = `0x${fingerprint(order.id).repeat(8)}`
    order.explorerUrl = explorers[order.network] + order.txHash
  }
  order.version += 1
  order.updatedAt = now()
  save()
  publishOrder(order)
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

/** Schedules automatic resolution according to the scenario. Also used after a reload. */
export function scheduleOrder(orderId: string) {
  const { orderOutcome, orderDelayMs } = db.config
  if (orderOutcome === 'manual' || timers.has(orderId)) return
  timers.set(
    orderId,
    setTimeout(() => {
      timers.delete(orderId)
      resolveOrder(orderId, orderOutcome)
    }, orderDelayMs),
  )
}

export function resumePendingOrders() {
  for (const order of db.orders) if (order.status === 'pending') scheduleOrder(order.id)
}

/** Order ids are deterministic, so timers from before a reset must not touch new orders. */
export function clearOrderTimers() {
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
}
