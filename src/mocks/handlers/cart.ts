import { http, HttpResponse } from 'msw'
import {
  addCartItemBody,
  applyCouponBody,
  mergeCartBody,
  network,
  updateCartItemBody,
} from '@/contracts/cart'
import { db, findNft, nextId, save, type CartRecord } from '../db/store'
import { computeQuote, lineInfo, toCart } from '../domain'
import { body, fail, optionalUser, requireUser, validate } from '../lib'

/** Signed-in users get their own cart; guests are identified by the X-Cart-Id header. */
function resolveCart(request: Request): CartRecord {
  const user = optionalUser(request)
  const existing = user
    ? Object.values(db.carts).find((c) => c.userId === user.id)
    : db.carts[request.headers.get('X-Cart-Id') ?? '']
  if (existing && (user || existing.userId === null)) return existing
  const cart: CartRecord = {
    id: nextId('cart'),
    userId: user?.id ?? null,
    items: [],
    couponCode: null,
  }
  db.carts[cart.id] = cart
  save()
  return cart
}

function respond(cart: CartRecord) {
  save()
  return HttpResponse.json(toCart(cart))
}

function checkStock(item: CartRecord['items'][number]) {
  const { maxQuantity } = lineInfo(item)
  if (item.quantity > maxQuantity)
    fail('OUT_OF_STOCK', {
      message:
        maxQuantity === 0
          ? 'Esta edição está esgotada'
          : `Apenas ${maxQuantity} disponíveis nesta edição`,
      details: { maxQuantity },
    })
}

export const cartHandlers = [
  http.get('/api/cart', ({ request }) => respond(resolveCart(request))),

  http.post('/api/cart/items', async ({ request }) => {
    const cart = resolveCart(request)
    const input = await body(request, addCartItemBody)
    const nft = findNft(input.nftId)
    if (!nft?.editions.some((e) => e.id === input.editionId))
      fail('NOT_FOUND', { message: 'Esta edição não existe' })
    const existing = cart.items.find((i) => i.editionId === input.editionId)
    const item = existing
      ? { ...existing, quantity: existing.quantity + input.quantity }
      : { id: nextId('item'), ...input }
    checkStock(item)
    cart.items = existing
      ? cart.items.map((i) => (i === existing ? item : i))
      : [...cart.items, item]
    return respond(cart)
  }),

  http.patch('/api/cart/items/:itemId', async ({ request, params }) => {
    const cart = resolveCart(request)
    const { quantity } = await body(request, updateCartItemBody)
    const item = cart.items.find((i) => i.id === params.itemId) ?? fail('NOT_FOUND')
    checkStock({ ...item, quantity })
    item.quantity = quantity
    return respond(cart)
  }),

  http.delete('/api/cart/items/:itemId', ({ request, params }) => {
    const cart = resolveCart(request)
    cart.items = cart.items.filter((i) => i.id !== params.itemId)
    return respond(cart)
  }),

  http.put('/api/cart/coupon', async ({ request }) => {
    const cart = resolveCart(request)
    const { code } = await body(request, applyCouponBody)
    const coupon = db.coupons.find((c) => c.code === code.toUpperCase())
    if (!coupon)
      fail('COUPON_INVALID', { fieldErrors: { code: 'Este código promocional não existe' } })
    if (Date.parse(coupon.expiresAt) <= Date.now())
      fail('COUPON_EXPIRED', { fieldErrors: { code: 'Este código promocional expirou' } })
    cart.couponCode = coupon.code
    return respond(cart)
  }),

  http.delete('/api/cart/coupon', ({ request }) => {
    const cart = resolveCart(request)
    cart.couponCode = null
    return respond(cart)
  }),

  /** Moves a guest cart into the signed-in user's cart, capping quantities by availability. */
  http.post('/api/cart/merge', async ({ request }) => {
    requireUser(request)
    const cart = resolveCart(request)
    const { guestCartId } = await body(request, mergeCartBody)
    const guest = db.carts[guestCartId]
    if (guest && guest.userId === null) {
      for (const guestItem of guest.items) {
        const existing = cart.items.find((i) => i.editionId === guestItem.editionId)
        const target = existing ?? { ...guestItem, id: nextId('item'), quantity: 0 }
        target.quantity = Math.min(
          target.quantity + guestItem.quantity,
          lineInfo(target).maxQuantity,
        )
        if (!existing && target.quantity > 0) cart.items.push(target)
      }
      cart.couponCode ??= guest.couponCode
      delete db.carts[guestCartId]
    }
    return respond(cart)
  }),

  http.get('/api/cart/quote', ({ request }) => {
    const cart = resolveCart(request)
    const selected = validate(
      network,
      new URL(request.url).searchParams.get('network') ?? 'ethereum',
    )
    return HttpResponse.json(computeQuote(cart, selected))
  }),

  http.get('/api/networks', () => HttpResponse.json(db.networks)),
]
