import { expect, test } from '@playwright/test'
import { api, injectSocketIo, login, reload, start } from './support'

declare global {
  interface Window {
    io: (opts: object) => {
      on: (event: string, cb: (payload: unknown) => void) => void
      io: { on: (event: string, cb: () => void) => void }
      connected: boolean
    }
    received: Record<string, unknown[]>
  }
}

type Page<T> = { items: T[]; total: number; totalPages: number; page: number }
type Summary = { id: string; price: string; category: string; available: number }

test('catalog: filters, sort, pagination, detail and not found', async ({ page }) => {
  await start(page)
  const all = await api<Page<Summary>>(page, 'GET', '/api/nfts')
  expect(all.status).toBe(200)
  expect(all.body.total).toBe(48)
  expect(all.body.items).toHaveLength(9)
  expect(all.body.totalPages).toBe(6)

  const filtered = await api<Page<Summary>>(
    page,
    'GET',
    '/api/nfts?category=digital-art&category=music&network=ethereum&availableOnly=true&sort=price-asc&pageSize=48',
  )
  expect(filtered.body.items.length).toBeGreaterThan(0)
  for (const item of filtered.body.items) {
    expect(['digital-art', 'music']).toContain(item.category)
    expect(item).toMatchObject({ network: 'ethereum' })
    expect(item.available).toBeGreaterThan(0)
  }
  const prices = filtered.body.items.map((i) => Number(i.price))
  expect(prices).toEqual([...prices].sort((a, b) => a - b))

  const search = await api<Page<Summary>>(page, 'GET', '/api/nfts?q=nomad')
  expect(search.body.items.every((i) => i.id)).toBe(true)
  expect(search.body.total).toBeGreaterThan(0)
  expect((await api<Page<Summary>>(page, 'GET', '/api/nfts?q=zzzz')).body.total).toBe(0)
  expect((await api<Page<Summary>>(page, 'GET', '/api/nfts?page=4')).body.items).toHaveLength(9)
  expect((await api(page, 'GET', '/api/nfts?sort=bogus')).status).toBe(422)

  expect((await api<Summary[]>(page, 'GET', '/api/nfts/featured')).body).toHaveLength(4)
  expect((await api(page, 'GET', '/api/nfts/nft-001')).status).toBe(200)
  expect(await api(page, 'GET', '/api/nfts/nope')).toMatchObject({
    status: 404,
    body: { code: 'NOT_FOUND' },
  })
})

test('auth: login, signup conflict, session expiry, logout', async ({ page }) => {
  await start(page)
  expect(
    await api(page, 'POST', '/api/auth/login', {
      body: { email: 'ana@example.com', password: 'wrong' },
    }),
  ).toMatchObject({ status: 422, body: { code: 'VALIDATION_ERROR' } })

  const conflict = await api(page, 'POST', '/api/auth/signup', {
    body: { username: 'ana2', email: 'ana@example.com', password: 'Secret123' },
  })
  expect(conflict).toMatchObject({
    status: 409,
    body: { fieldErrors: { email: expect.any(String) } },
  })

  const signup = await api<{ token: string; user: { email: string } }>(
    page,
    'POST',
    '/api/auth/signup',
    {
      body: {
        username: 'carla',
        email: 'carla@example.com',
        password: 'Secret123',
      },
    },
  )
  expect(signup.status).toBe(201)
  const stored = await page.evaluate(() =>
    window.__mock.state().users.find((u) => u.username === 'carla'),
  )
  expect(stored?.passwordHash).toMatch(/^[0-9a-f]{64}$/)
  expect(JSON.stringify(stored)).not.toContain('Secret123')

  const token = await login(page)
  expect((await api(page, 'GET', '/api/auth/session', { token })).status).toBe(200)
  await page.evaluate(() => window.__mock.expireSessions())
  expect(await api(page, 'GET', '/api/profile', { token })).toMatchObject({
    status: 401,
    body: { code: 'SESSION_EXPIRED' },
  })

  const fresh = await login(page)
  expect((await api(page, 'POST', '/api/auth/logout', { token: fresh })).status).toBe(204)
  expect((await api(page, 'GET', '/api/auth/session', { token: fresh })).status).toBe(401)
})

test('favorites: auth required, injected failure, persistence across reload', async ({ page }) => {
  await start(page)
  expect((await api(page, 'GET', '/api/favorites')).status).toBe(401)
  const token = await login(page)
  await page.evaluate(() =>
    window.__mock.configure({
      failures: [{ match: 'PUT /api/favorites', error: 'TRANSIENT', times: 1 }],
    }),
  )
  expect((await api(page, 'PUT', '/api/favorites/nft-005', { token })).status).toBe(503)
  const added = await api<{ items: Summary[] }>(page, 'PUT', '/api/favorites/nft-005', { token })
  expect(added.body.items.map((i) => i.id)).toEqual(['nft-003', 'nft-012', 'nft-005'])

  await reload(page)
  const after = await api<{ items: Summary[] }>(page, 'GET', '/api/favorites', { token })
  expect(after.body.items.map((i) => i.id)).toContain('nft-005')
})

test('cart: guest cart, stock limit, coupons, quote math, merge on login', async ({ page }) => {
  await start(page)
  const guest = await api<{ id: string }>(page, 'GET', '/api/cart')
  const headers = { 'X-Cart-Id': guest.body.id }
  // nft-001 edition 1/50: price 1.19, 47 available, max 10 per order.
  const added = await api(page, 'POST', '/api/cart/items', {
    headers,
    body: { nftId: 'nft-001', editionId: 'nft-001-e50', quantity: 2 },
  })
  expect(added.status).toBe(200)
  expect(
    await api(page, 'POST', '/api/cart/items', {
      headers,
      body: { nftId: 'nft-001', editionId: 'nft-001-e50', quantity: 9 },
    }),
  ).toMatchObject({ status: 409, body: { code: 'OUT_OF_STOCK', details: { maxQuantity: 10 } } })
  expect(
    await api(page, 'POST', '/api/cart/items', {
      headers,
      body: { nftId: 'nft-014', editionId: 'nft-014-e50', quantity: 1 },
    }),
  ).toMatchObject({ status: 409, body: { code: 'OUT_OF_STOCK' } })

  expect(
    await api(page, 'PUT', '/api/cart/coupon', { headers, body: { code: 'NOPE' } }),
  ).toMatchObject({
    status: 422,
    body: { code: 'COUPON_INVALID' },
  })
  expect(
    await api(page, 'PUT', '/api/cart/coupon', { headers, body: { code: 'summer20' } }),
  ).toMatchObject({
    status: 422,
    body: { code: 'COUPON_EXPIRED' },
  })
  expect(
    (await api(page, 'PUT', '/api/cart/coupon', { headers, body: { code: 'welcome10' } })).status,
  ).toBe(200)

  const quote = await api(page, 'GET', '/api/cart/quote?network=ethereum', { headers })
  expect(quote.body).toMatchObject({
    subtotal: '2.38',
    discount: '0.238',
    networkFee: '0.016',
    total: '2.158',
    valid: true,
  })

  const token = await login(page)
  await api(page, 'POST', '/api/cart/items', {
    token,
    body: { nftId: 'nft-001', editionId: 'nft-001-e50', quantity: 9 },
  })
  const merged = await api<{ items: { quantity: number }[]; couponCode: string }>(
    page,
    'POST',
    '/api/cart/merge',
    {
      token,
      body: { guestCartId: guest.body.id },
    },
  )
  expect(merged.body.items).toHaveLength(1)
  expect(merged.body.items[0].quantity).toBe(10)
  expect(merged.body.couponCode).toBe('WELCOME10')
})

async function prepareCheckout(page: import('@playwright/test').Page) {
  const token = await login(page)
  await api(page, 'POST', '/api/cart/items', {
    token,
    body: { nftId: 'nft-001', editionId: 'nft-001-e50', quantity: 2 },
  })
  await api(page, 'POST', '/api/wallets/wallet-ana-1/connect', {
    token,
    body: { network: 'ethereum' },
  })
  const quote = await api<{ id: string }>(page, 'GET', '/api/cart/quote?network=ethereum', {
    token,
  })
  const order = {
    quoteId: quote.body.id,
    network: 'ethereum',
    walletId: 'wallet-ana-1',
    provider: 'metamask',
    collector: {
      displayName: 'Ana Souza',
      username: 'ana',
      profileName: 'Ana Coleções',
      email: 'ana@example.com',
      ensName: 'ana.eth',
      referralCode: 'KURIO1',
    },
  }
  return { token, order }
}

test('orders: idempotency, stale quote, confirmation effects, ownership', async ({ page }) => {
  await start(page)
  await page.evaluate(() => window.__mock.configure({ orderOutcome: 'manual' }))
  const { token, order } = await prepareCheckout(page)

  expect((await api(page, 'POST', '/api/orders', { token, body: order })).status).toBe(422)
  const headers = { 'Idempotency-Key': 'attempt-1' }
  const created = await api<{ id: string; status: string }>(page, 'POST', '/api/orders', {
    token,
    headers,
    body: order,
  })
  expect(created).toMatchObject({ status: 201, body: { status: 'pending' } })
  const again = await api<{ id: string }>(page, 'POST', '/api/orders', {
    token,
    headers,
    body: order,
  })
  expect(again).toMatchObject({ status: 200, body: { id: created.body.id } })
  const different = { ...order, collector: { ...order.collector, displayName: 'Someone Else' } }
  expect(await api(page, 'POST', '/api/orders', { token, headers, body: different })).toMatchObject(
    {
      status: 409,
      body: { code: 'IDEMPOTENCY_CONFLICT' },
    },
  )

  await page.evaluate((id) => window.__mock.resolveOrder(id, 'confirmed'), created.body.id)
  const confirmed = await api(page, 'GET', `/api/orders/${created.body.id}`, { token })
  expect(confirmed.body).toMatchObject({
    status: 'confirmed',
    total: '2.396',
    txHash: expect.stringMatching(/^0x/),
  })
  expect(
    (await api<{ items: unknown[] }>(page, 'GET', '/api/cart', { token })).body.items,
  ).toHaveLength(0)
  const nft = await api<{ editions: { id: string; available: number }[]; version: number }>(
    page,
    'GET',
    '/api/nfts/nft-001',
  )
  expect(nft.body.editions.find((e) => e.id === 'nft-001-e50')?.available).toBe(45)
  expect(nft.body.version).toBe(2)

  // Receipt is a snapshot: later catalog changes do not affect it.
  await page.evaluate(() => window.__mock.updateEdition('nft-001', 'nft-001-e50', { price: '9' }))
  expect((await api(page, 'GET', `/api/orders/${created.body.id}`, { token })).body).toMatchObject({
    total: '2.396',
  })

  const bruno = await login(page, 'bruno@example.com')
  expect((await api(page, 'GET', `/api/orders/${created.body.id}`, { token: bruno })).status).toBe(
    403,
  )
})

test('orders: price change at submission requires a new quote', async ({ page }) => {
  await start(page, 'price-change')
  await page.evaluate(() => window.__mock.configure({ latency: 0 }))
  const { token, order } = await prepareCheckout(page)
  const rejected = await api<{
    code: string
    details: { quote: { id: string; subtotal: string } }
  }>(page, 'POST', '/api/orders', { token, headers: { 'Idempotency-Key': 'k1' }, body: order })
  expect(rejected.status).toBe(409)
  expect(rejected.body.code).toBe('QUOTE_CHANGED')
  expect(rejected.body.details.quote.subtotal).toBe('2.618')
  const retry = await api(page, 'POST', '/api/orders', {
    token,
    headers: { 'Idempotency-Key': 'k2' },
    body: { ...order, quoteId: rejected.body.details.quote.id },
  })
  expect(retry.status).toBe(201)
})

test('orders: timeout after creation recovers the same order with the same key', async ({
  page,
}) => {
  await start(page, 'order-timeout')
  await page.evaluate(() => window.__mock.configure({ latency: 0, orderOutcome: 'manual' }))
  const { token, order } = await prepareCheckout(page)
  const timedOut = await page.evaluate(
    async ({ token, order }) => {
      try {
        await fetch('/api/orders', {
          method: 'POST',
          signal: AbortSignal.timeout(500),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'Idempotency-Key': 'k',
          },
          body: JSON.stringify(order),
        })
        return false
      } catch {
        return true
      }
    },
    { token, order },
  )
  expect(timedOut).toBe(true)
  const retry = await api<{ id: string }>(page, 'POST', '/api/orders', {
    token,
    headers: { 'Idempotency-Key': 'k' },
    body: order,
  })
  expect(retry.status).toBe(200)
  expect(await page.evaluate(() => window.__mock.state().orders.length)).toBe(1)
})

test('network: offline and out-of-order responses', async ({ page }) => {
  await start(page, 'out-of-order')
  // Let the page's own catalog requests finish, then restart the slow/fast sequence for this check.
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.__mock.configure({}))
  const order = await page.evaluate(async () => {
    const done: string[] = []
    await Promise.all(
      ['first', 'second'].map((label) =>
        fetch(`/api/nfts?q=${label}`).then(() => {
          done.push(label)
        }),
      ),
    )
    return done
  })
  expect(order).toEqual(['second', 'first'])

  await page.evaluate(() => window.__mock.configure({ offline: true, latency: 0 }))
  const failed = await page.evaluate(() =>
    fetch('/api/nfts').then(
      () => false,
      () => true,
    ),
  )
  expect(failed).toBe(true)
})

test('socket: nft.updated to everyone, order.updated only to its owner, duplicates and reconnect', async ({
  page,
}) => {
  await start(page)
  await page.evaluate(() => window.__mock.configure({ orderOutcome: 'manual' }))
  const { token, order } = await prepareCheckout(page)
  const bruno = await login(page, 'bruno@example.com')
  await injectSocketIo(page)

  await page.evaluate(
    async ({ token, bruno }) => {
      window.received = { ana: [], bruno: [], reconnects: [] }
      const open = (name: 'ana' | 'bruno', t: string) =>
        new Promise<void>((resolve) => {
          const socket = window.io({
            path: '/realtime/',
            transports: ['websocket'],
            auth: { token: t },
          })
          socket.on('connect', () => resolve())
          socket.on('nft.updated', (e) => window.received[name].push(e))
          socket.on('order.updated', (e) => window.received[name].push(e))
          if (name === 'ana') socket.io.on('reconnect', () => window.received.reconnects.push(true))
        })
      await Promise.all([open('ana', token), open('bruno', bruno)])
    },
    { token, bruno },
  )

  await page.evaluate(() => window.__mock.updateEdition('nft-002', 'nft-002-e1', { price: '0.5' }))
  await expect.poll(() => page.evaluate(() => window.received.bruno.length)).toBe(1)
  expect(await page.evaluate(() => window.received.ana[0])).toMatchObject({
    type: 'nft.updated',
    resourceId: 'nft-002',
    version: 2,
    payload: { editions: expect.arrayContaining([expect.objectContaining({ price: '0.5' })]) },
  })

  const created = await api<{ id: string }>(page, 'POST', '/api/orders', {
    token,
    headers: { 'Idempotency-Key': 'socket' },
    body: order,
  })
  await page.evaluate((id) => window.__mock.resolveOrder(id, 'refused'), created.body.id)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.received.ana.filter((e) => (e as { type: string }).type === 'order.updated')
            .length,
      ),
    )
    .toBe(1)
  expect(await page.evaluate(() => window.received.bruno.length)).toBe(1)

  const lastId = await page.evaluate(() => window.__mock.events().at(-1)!.id)
  await page.evaluate((id) => window.__mock.replay(id), lastId)
  await expect.poll(() => page.evaluate(() => window.received.ana.length)).toBe(3)

  await page.evaluate(() => window.__mock.dropConnections())
  await expect
    .poll(() => page.evaluate(() => window.received.reconnects.length), { timeout: 10_000 })
    .toBe(1)
})

test('mocks survive the browser stopping the idle service worker', async ({ page }) => {
  await start(page)
  // Chrome only stops an idle worker; stopping it mid-request would fail that request.
  await page.waitForLoadState('networkidle')
  // What Chrome does to an idle worker, e.g. in a background tab; the restarted worker has no clients.
  const cdp = await page.context().newCDPSession(page)
  const status = (wanted: string) =>
    new Promise<string>((resolve) =>
      cdp.on('ServiceWorker.workerVersionUpdated', ({ versions }) => {
        const version = versions.find((v) => v.runningStatus === wanted)
        if (version) resolve(version.versionId)
      }),
    )
  const running = status('running')
  const stopped = status('stopped')
  await cdp.send('ServiceWorker.enable')
  await cdp.send('ServiceWorker.stopWorker', { versionId: await running })
  await stopped
  // The tab comes back into view and announces itself; wait for the worker to confirm.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('message', (e) => {
          if (e.data?.type === 'MOCKING_ENABLED') resolve()
        })
        document.dispatchEvent(new Event('visibilitychange'))
      }),
  )
  // A request that passes through gets Vite's index.html (GET) or a 404 (POST) instead.
  const type = await page.evaluate(
    async () => (await fetch('/api/nfts/facets')).headers.get('content-type') ?? '',
  )
  expect(type).toContain('application/json')
})

test('reset restores the seed', async ({ page }) => {
  await start(page)
  const token = await login(page)
  await api(page, 'PUT', '/api/favorites/nft-020', { token })
  await page.evaluate(() => window.__mock.reset())
  const state = await page.evaluate(() => window.__mock.state())
  expect(state.favorites['user-ana']).toEqual(['nft-003', 'nft-012'])
  expect(state.sessions).toHaveLength(0)
})

test('catalog: tabs, collection filter and facets', async ({ page }) => {
  await start(page)
  const tab = await api<Page<Summary & { isNew: boolean }>>(
    page,
    'GET',
    '/api/nfts?tab=new&pageSize=48',
  )
  expect(tab.body.total).toBe(12)
  const collection = await api<Page<Summary & { collection: string }>>(
    page,
    'GET',
    '/api/nfts?collection=Kurio%20Apes&pageSize=48',
  )
  expect(collection.body.items.every((i) => i.collection === 'Kurio Apes')).toBe(true)
  const facets = await api<{
    categories: Record<string, number>
    networks: Record<string, number>
    price: object
  }>(page, 'GET', '/api/nfts/facets')
  expect(Object.values(facets.body.categories).reduce((a, b) => a + b)).toBe(48)
  expect(Object.values(facets.body.networks).reduce((a, b) => a + b)).toBe(48)
  expect(facets.body.price).toEqual({ min: '0.02', max: '12.3' })
})
