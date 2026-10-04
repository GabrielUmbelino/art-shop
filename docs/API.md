# API contracts

REST and Socket.IO contracts between the app and the simulated backend. Every payload is defined once as a zod schema in `src/contracts/`; the client parses responses with them and the MSW handlers in `src/mocks/` validate requests with them. TypeScript types are inferred from the schemas.

## Conventions

- Base path: `/api`. JSON in and out.
- Auth: `Authorization: Bearer <token>`, token from signup or login.
- Guest cart: `X-Cart-Id: <cartId>`, the id returned by the first `GET /api/cart` without auth.
- ETH amounts are decimal strings (`"2.5"`, up to 18 decimals), never numbers. Quantities are integers.
- Dates are ISO 8601 UTC strings.

### Errors

Every error has the same body (`apiError` in `contracts/common.ts`):

```json
{ "code": "VALIDATION_ERROR", "message": "Some fields are invalid", "fieldErrors": { "email": "Enter a valid email" }, "details": {} }
```

| Code | Status | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 422 | Invalid body or query; `fieldErrors` maps field to message. Also wrong login credentials |
| `COUPON_INVALID` / `COUPON_EXPIRED` | 422 | Coupon does not exist / has expired |
| `UNAUTHENTICATED` | 401 | No session, or unknown token |
| `SESSION_EXPIRED` | 401 | Token is known but expired |
| `FORBIDDEN` | 403 | Resource belongs to another user |
| `NOT_FOUND` | 404 | Unknown NFT, edition, order, wallet or cart item |
| `CONFLICT` | 409 | Email, username, wallet slot or wallet address already used; `fieldErrors` set |
| `OUT_OF_STOCK` | 409 | Quantity above availability or per-order limit; `details.maxQuantity` |
| `QUOTE_CHANGED` | 409 | Order submitted with an outdated or invalid quote; `details.quote` is the current one |
| `IDEMPOTENCY_CONFLICT` | 409 | Idempotency key reused with a different order body |
| `WALLET_REJECTED` | 409 | Simulated wallet refused the connection |
| `WALLET_NOT_CONNECTED` | 409 | Order submitted without connecting the wallet on the selected network |
| `TRANSIENT` | 503 | Temporary failure; safe to retry |

Network failures (offline, timeouts) have no body; the client sees a request error.

## Endpoints

Schemas are in `src/contracts/<file>.ts`. "Auth" means a valid bearer token is required.

### Session and account (`user.ts`)

| Method and path | Auth | Body | Response |
| --- | --- | --- | --- |
| `POST /auth/signup` | | `signupBody` | 201 `session` |
| `POST /auth/login` | | `loginBody` | 200 `session` |
| `GET /auth/session` | Auth | | 200 `session` |
| `POST /auth/logout` | | | 204 |

A session is `{ token, expiresAt, user }`. Sessions expire after 30 minutes (one minute in the `session-expiry` scenario), and `SESSION_EXPIRED` is returned from then on.

### NFTs (`nft.ts`)

| Method and path | Response |
| --- | --- |
| `GET /nfts?q&category&network&collection&minPrice&maxPrice&availableOnly&tab&sort&page&pageSize` | 200 `nftList` (paginated `nftSummary`) |
| `GET /nfts/facets` | 200 `nftFacets`: counts per category and network, catalog price bounds |
| `GET /nfts/featured` | 200 `nftSummary[]` |
| `GET /nfts/:id` | 200 `nft`, 404 |

- **Filters:**
  - `q` matches the name, collection or creator.
  - `category` and `network` repeat for multiple values (`category=music&category=gaming`).
  - Filters combine with AND. Values within one filter combine with OR.
- **Tabs:** `tab` is `all` (default), `new` (new releases) or `trending`.
- **Sort:** `sort` is `newest` (default), `price-asc`, `price-desc` or `name`.
- **Page size:** `pageSize` defaults to 9 (the design's 3 × 3 grid), max 48.
- **Categories:** `digital-art`, `photography`, `music`, `3d`, `collectibles`, `generative`, `gaming`, `subscriptions`, `utility`.
- **Networks:** `ethereum`, `polygon`, `solana`.
- **Price fields:**
  - `price` is the lowest price among the editions still available.
  - `compareAtPrice` is an optional previous price, shown struck through.
  - `available` is the sum across editions.
- **Editions:** each NFT has up to 4: `1/1`, `1/10`, `1/50` and `Aberta`.
  - The open edition has `supply: null`.
  - An edition with `available: 0` is unavailable.
  - `maxPerOrder` (10) caps the quantity of one edition per order.
- **Details only:** `description`, `images`, `editions`, `attributes`, `contractAddress`, `royaltyPercent`, `rating` and `reviews` come only with `GET /nfts/:id`.
- **Version:** `version` increases on every change and matches the `nft.updated` event version.

### Favorites (`nft.ts`)

| Method and path | Auth | Response |
| --- | --- | --- |
| `GET /favorites` | Auth | 200 `favorites` (`{ items: nftSummary[] }`) |
| `PUT /favorites/:nftId` | Auth | 200 `favorites` |
| `DELETE /favorites/:nftId` | Auth | 200 `favorites` |

Both mutations are idempotent and return the full list.

### Cart and quote (`cart.ts`)

Works for guests (with `X-Cart-Id`) and signed-in users (with the bearer token). All mutations return the updated `cart`.

| Method and path | Auth | Body | Response |
| --- | --- | --- | --- |
| `GET /cart` | Optional | | 200 `cart` (creates one if needed) |
| `POST /cart/items` | Optional | `addCartItemBody` | 200 `cart`; adds to an existing line of the same edition |
| `PATCH /cart/items/:itemId` | Optional | `{ quantity }` | 200 `cart` |
| `DELETE /cart/items/:itemId` | Optional | | 200 `cart` |
| `PUT /cart/coupon` | Optional | `{ code }` | 200 `cart`, 422 `COUPON_*` |
| `DELETE /cart/coupon` | Optional | | 200 `cart` |
| `POST /cart/merge` | Auth | `{ guestCartId }` | 200 `cart`; moves guest items into the user cart, capped by availability |
| `GET /cart/quote?network=` | Optional | | 200 `quote` |
| `GET /networks` | | | 200 `networkInfo[]` |

Cart items always reflect the current price (`unitPrice`) and limit (`maxQuantity`).

The quote is the source of truth for totals:

- `total = subtotal - discount + networkFee`
- The discount is a percentage of the subtotal, rounded down to 6 decimals.
- `quote.id` is a fingerprint of every value in the quote, so it changes whenever a price, availability, coupon or fee changes.
- Lines with stock problems carry an `issue` (`sold-out` or `insufficient-stock`), and `valid` is then false.

### Orders (`order.ts`)

| Method and path | Auth | Headers | Body | Response |
| --- | --- | --- | --- | --- |
| `POST /orders` | Auth | `Idempotency-Key` (required) | `createOrderBody` | 201 `order` (new), 200 `order` (same key and body) |
| `GET /orders/:id` | Auth | | | 200 `order`, 403, 404 |

Creating an order:

1. **Same key, same body** returns the existing order. **Same key, different body** returns `IDEMPOTENCY_CONFLICT`.
2. The server recomputes the quote. If it is invalid or its id differs from `quoteId`, the response is `QUOTE_CHANGED` with the new quote, and the user must confirm again.
3. The wallet must belong to the user and be connected on the order's network.
4. The order starts as `pending`. It becomes `confirmed` or `refused` later, announced through `order.updated`. Both of those states are final.
5. On confirmation, stock is consumed (which emits `nft.updated`) and only the bought quantities are removed from the cart. On refusal, the cart is left untouched.
6. Orders are snapshots: `lines`, `coupon` and the totals never change after creation.
7. `txHash` and `explorerUrl` are simulated.

### Profile (`user.ts`)

| Method and path | Auth | Body | Response |
| --- | --- | --- | --- |
| `GET /profile` | Auth | | 200 `user` |
| `PATCH /profile` | Auth | `profileUpdateBody` | 200 `user`; 409 on email or username conflict |
| `PUT /profile/password` | Auth | `passwordChangeBody` | 204; 422 with `fieldErrors.currentPassword` if wrong |

The avatar is sent as a `data:image/...;base64,` URL in `avatarUrl` (under 1 MB), or `null` to remove it. Passwords are stored as salted SHA-256 hashes.

### Wallets (`wallet.ts`)

| Method and path | Auth | Body | Response |
| --- | --- | --- | --- |
| `GET /wallets` | Auth | | 200 `wallet[]` |
| `POST /wallets` | Auth | `walletBody` | 201 `wallet`; 409 if the slot or address is taken |
| `PATCH /wallets/:id` | Auth | `walletUpdateBody` | 200 `wallet` |
| `POST /wallets/:id/connect` | Auth | `{ network }` | 200 `walletConnection`; 409 `WALLET_REJECTED` |
| `DELETE /wallets/:id/connection` | Auth | | 204 |

Each user has at most one `primary` and one `secondary` wallet. Changing a wallet's address drops its connection.

## Realtime events (`events.ts`)

Socket.IO on path `/realtime/` (exported as `socketPath`), using the `websocket` transport only. The client sends its token in the handshake: `io({ path: socketPath, transports: ['websocket'], auth: { token } })`.

Every event has the same envelope:

```json
{ "id": "evt-12", "type": "nft.updated", "resourceId": "nft-002", "version": 3, "occurredAt": "2026-10-02T17:00:00.000Z", "payload": {} }
```

| Event | Audience | Payload | Emitted when |
| --- | --- | --- | --- |
| `nft.updated` | Every socket | full `nft` | Price or availability changes (purchase, scenario, control API) |
| `order.updated` | The order owner's sockets | full `order` | A pending order is confirmed or refused |

- `id` is unique per event. Duplicates repeat the same `id`.
- `version` is the resource version after the change. The client ignores events whose version is lower than or equal to the cached one.
- Private events are only delivered to sockets whose handshake token belongs to the owner and is still valid.
- The client is expected to reconcile active resources over REST after reconnecting, since events may be missed while disconnected.

## Mock environment

### Transport and limitations

- REST is served by MSW's service worker, enabled with `VITE_ENABLE_MOCKS=true` (on in `.env` for dev and the demo build).
- Socket.IO is simulated with MSW's WebSocket interception and `@mswjs/socket.io-binding`. Limitations:
  - **Path:** the default `/socket.io/` path can't be used. MSW strips that prefix before matching, so a handler would also capture Vite's HMR socket. Hence `/realtime/`.
  - **Transport:** only the `websocket` transport is intercepted. Long-polling would go to the service worker and fail.
  - **Handshake:** the binding answers it itself, so a connection can't be refused for a bad token. Instead, the token is read from the CONNECT packet and only scopes private events.
  - **Pings:** the binding doesn't send them, so the mock sends one every 25 s to keep socket.io-client from timing out.
  - **No rooms, namespaces or broadcast:** the mock keeps its own list of connections.
  - **Load order:** `engine.io-client` reads `globalThis.WebSocket` once, when its module is evaluated. `main.tsx` therefore starts the mocks before importing the app, so the patched WebSocket is the one captured.
- Interception runs in the page. Each browser tab has its own mock server. All tabs share one persisted database, but changes made in one tab are not pushed to the others.

### State, scenarios and reset

- The mock database (`src/mocks/db/`) is persisted in `localStorage` under `nft-mock:db`, so it survives refreshes.
- Ids are sequential (`order-7`), so receipts and screenshots are stable.
- **Scenarios** (`src/mocks/scenarios.ts`) set latency, failures and behaviours. Select one with `?scenario=<name>`. Switching to a different scenario resets the data; loading the same one keeps it.

| Scenario | Behaviour |
| --- | --- |
| `default` | 150 to 400 ms latency, everything succeeds |
| `fast` | No latency (automated tests) |
| `empty` | Catalog without NFTs |
| `slow` / `variable-latency` | 2.5 s per request / 0.2 to 2.5 s |
| `out-of-order` | Alternating 1.5 s and 0.1 s per route, so later requests resolve first |
| `offline` / `server-error` | Network error / 503 on every request |
| `flaky` | First catalog request and first favorite toggle fail with 503 |
| `session-expiry` | Sessions last one minute |
| `price-change` / `sold-out` | The first cart item's price rises / it sells out when the order is submitted |
| `order-timeout` | The first order is created but its response never arrives; retrying with the same key recovers it |
| `payment-refused` | Orders are refused |
| `wallet-rejected` | Wallet connections are rejected |

**Control API.** `window.__mock` is available when mocks are enabled and becomes defined once interception is active. It is used by Playwright and handy in the console:

| Call | Effect |
| --- | --- |
| `reset(scenario?)` | Restores the seed data with the given or current scenario |
| `configure(patch)` | Overrides scenario settings, e.g. `{ latency: 0, orderOutcome: 'manual', failures: [{ match: 'PUT /api/favorites', error: 'TRANSIENT', times: 1 }] }` |
| `expireSessions()` | Expires every session |
| `updateEdition(nftId, editionId, { price?, available? })` | Changes an edition and emits `nft.updated` |
| `resolveOrder(orderId, 'confirmed' \| 'refused')` | Settles a pending order (for `orderOutcome: 'manual'`) |
| `events()` / `replay(eventId)` | Lists emitted events / re-delivers one (a duplicate, or a stale event if newer ones followed) |
| `dropConnections()` | Closes all sockets; clients reconnect unless `socketOffline` is set |
| `state()` | Copy of the mock database, for assertions |

### Seed data

- **NFTs:** 48, across 9 categories, 3 networks, 6 collections and 6 creators.
  - The first 9 reproduce the design's catalog grid (Emerald Ape #042, Sage Nomad #009, Neon Vessel #552...).
  - From item 10 on, every 7th NFT is sold out and every 5th has its `1/10` edition sold out. Example: `nft-005` has a sold-out `1/10` edition and `nft-014` is fully sold out.
- **Users:** two, both with the password `Collector123`:
  - `ana@example.com` has 1 wallet and 2 favorites.
  - `bruno@example.com` has 2 wallets.
- **Coupons:**
  - `WELCOME10`: 10%
  - `COLLECTOR25`: 25%
  - `SUMMER20`: expired
- **Network fees** (the Ethereum fee matches the design):
  - Ethereum: 0.016 ETH
  - Polygon: 0.002 ETH
  - Solana: 0.001 ETH
- **Images:** NFT artwork is the four images from the design exports. Creator avatars are generated placeholders.
