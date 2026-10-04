# Architecture

Full write-up comes in Phase 9. Contracts and the mock environment are documented in [docs/API.md](docs/API.md).

## Data layer

- **HTTP.** Every REST call goes through the Axios instance in `src/api/http.ts`. Failures become an `ApiError` with a `code`: the API's error code, or `NETWORK` / `TIMEOUT` when no answer arrived. Field errors from the API are mapped onto form fields by `applyApiError`.
- **Cache and retries** (`src/app/query-client.ts`):
  - Data is fresh for 30 s, then refetched in the background on mount, focus and reconnect.
  - Queries retry at most twice, and only on `TRANSIENT`, `NETWORK` or `TIMEOUT` errors. 4xx errors never retry.
  - Mutations never retry automatically; each one owns its recovery.
- **Isolation.** Private data lives under `['private', userId, ...]` query keys. On any session change, all `private` queries are removed.

## Session

- **Token.** It's stored in `localStorage` (`kurio:token`) so the session survives a refresh, and sent as a bearer token. The session itself is a cached query (`sessionQuery`) that is set on login and cleared on logout.
- **Guard.** Private pages live under the pathless `_authenticated` route, whose guard redirects to `/login?redirect=<path>`. Only same-origin paths are accepted as redirects.
- **Session changes.** `SessionWatcher` is the single place that reacts to them:
  - It removes private cache and replaces the socket, so a new socket carries the new token.
  - When a 401 ends the session on a private page, it shows a toast and redirects to login with `reason=expired`. After signing in, the user returns to the same page.

## Cart

- **Guest cart.** A guest's cart lives on the API under an id kept in `localStorage` (`kurio:cart`) and sent as `X-Cart-Id`. Signed-in users always get their own cart; the API ignores the header for them.
- **Merge on login.** After login or sign-up, the guest cart is merged into the user's cart (quantities capped by availability) and the guest id is dropped.
- **Cache keys.** The cart is cached as `['cart', 'guest']` or `['private', userId, 'cart']`, with the quote under the same prefix. Every mutation stores the returned cart and refetches the quote.
- **Totals come from the quote.** The client never computes totals. Lines with stock issues come back with an `issue`, and checkout is disabled until they are fixed.

## Realtime

- **Socket lifecycle.** One Socket.IO connection per session token. Login, logout and user switch replace it, and the old socket's listeners are removed.
- **Applying `nft.updated`** (`src/realtime/sync.ts`):
  - Duplicate events (same `id`) and stale ones (`version` not newer than the last applied or cached) are dropped.
  - Otherwise the event updates the NFT's details entry and every cached list and featured item in place, and marks lists and facets stale for their next use.
- **Cart items.** When an event touches an NFT in a cached cart, the change (price, sold out, low stock) is described in a notice on the cart page, announced to screen readers and shown as a toast. The cart and quote are then refetched.
- **Reconnect.** After a reconnect, active NFT, cart and private queries are refetched from REST, because events may have been missed.
- **Load order.** `engine.io-client` captures `globalThis.WebSocket` when its module is evaluated, so `main.tsx` starts the mocks before importing the app.

## Checkout and orders

- **Draft.** The checkout form is saved per user in `localStorage` (`kurio:checkout:<userId>`), so a refresh or an expired session (login, then return to `/checkout`) keeps what was typed. It is cleared when an order is confirmed.
- **Wallet connection.** Choosing a saved wallet, a network and a provider, then "Conectar carteira", calls the simulated connection. It can be rejected (scenario) or disconnected. Changing wallet, network or provider requires connecting again, and the API refuses orders from a wallet that isn't connected on the selected network.
- **Review.** "Confirmar compra" validates the form and opens a review with a fresh quote. Confirming fetches the quote again, and any difference (or the API's `QUOTE_CHANGED`) replaces the reviewed values and asks for a new confirmation. A realtime change while reviewing is flagged immediately.
- **Idempotency.** Each attempt uses an `Idempotency-Key` stored with the request body; the same body reuses the key. The order request has its own 6 s timeout. On a timeout or network error it is retried (up to twice) with the same key, so the API returns the order created by the first attempt. The confirm button is locked while a request is in flight.
- **Order page** (`/orders/:id`):
  - **Pending:** shows a waiting state and survives refresh. Updates arrive through `order.updated`, with REST reconciliation on reconnect and a 15 s polling fallback.
  - **Refused:** keeps the cart.
  - **Confirmed:** shows the receipt, rendered only from the order snapshot. The API removes the bought units from the cart, and the client refetches it.

## Deviations, substitutions and limitations

Logged as they are introduced.

| Area | Decision | Reason |
| --- | --- | --- |
| Design source | Tokens, layout and assets come from the SVG exports in `screens/`, not from Figma directly | The Figma MCP has no access to the file |
| Typography | Roboto Mono, identified from outlined glyphs; sizes measured from renders (±1px) | The exports outline all text, so font names and sizes are not recorded |
| Assets | The design's four artworks are reused across all 48 seed NFTs, converted from 1254px PNGs (about 2 MB each) to AVIF 480/960px plus a JPEG fallback | Matches the design, which repeats the same four images; keeps pages light |
| Assets | Creator avatars are generated placeholders | The design shows no creator images |
| Theme | Dark only (`<html class="dark">`) | The design has no light theme |
| Realtime | Socket.IO path is `/realtime/` instead of `/socket.io/`; websocket transport only | MSW strips `/socket.io/` before matching, which would collide with Vite's HMR socket; MSW only intercepts WebSocket, not long-polling |
| Realtime | Mock socket connections cannot be refused on bad tokens; private events are filtered by the token sent in the handshake | `@mswjs/socket.io-binding` answers the handshake itself |
| Mocks | The mock server runs inside each tab; the database is shared through `localStorage`, but changes are not pushed to other open tabs | MSW intercepts in the page |
| Auth | Sign-up has no display-name field (the design asks for username, e-mail, password and confirmation); the display name starts as the username | Follows the design |
| Auth | Login and sign-up are dialogs over the home page on desktop (also when opened from another page) and full pages on mobile | As designed; closing returns to the `redirect` target |
| Auth | The dialog overlay dims the page (40% black); the design shows no overlay | Signals that the page behind is inert while the dialog is open |
| Header | Signed-in users get an account menu (profile, wallets, wish list, log out) instead of "Entrar" | Not designed; built from the design's tokens |
| Header | "Mercado" points to the catalog on the home page and is active on NFT, cart, checkout and order pages | The design has no separate market page |
| Scope | Criadores, Aprenda, social login, password recovery, newsletter, help links and social profiles show an "Em breve" notice | Out of scope; they must not appear to work |
| Accessibility | Auth fields have visually hidden labels; the designs only show placeholders | Labels are required for assistive technology |
| Catalog | Desktop search opens from the header's search icon (an inline field); mobile uses the designed search bar | The desktop design has a search icon but no field |
| Catalog | Filter counts are over the whole catalog, not the current results | Matches the design's static counts; keeps filters predictable |
| Catalog | "Limpar filtros" link and a previous-page arrow in pagination | Not in the design; needed to undo filters and to go back by keyboard |
| Catalog | The hero carousel uses static slides (no auto-rotation) | Keeps the LCP image independent of the API; no motion without user action |
| Catalog | Blog cards ("Diário da Cunhagem") are static teasers; "Ler mais" shows "Em breve" | Editorial pages are out of scope |
| NFT details | The selected edition is in the URL (`?edition=`); sold-out editions are disabled pills, and a link to one shows an "unavailable" message | Direct access to an unavailable edition (spec §3) |
| NFT details | "Contrato" shows the contract address and "Direitos autorais" the royalty text | The design has the two texts swapped |
| NFT details | On mobile the reviews tab reads "Avaliações (19)" and the tab bar is hidden (the purchase panel takes its place) | The long label overflowed at 390px; the mobile design has no tab bar on this page |
| Data | The first 9 seed NFTs reproduce the design's grid; generated NFTs reuse the 4 artworks | Visual fidelity and stable visual baselines |
| Cart | The header and tab bar badge counts cart lines, not units | The design shows a fixed number; lines keep the badge short with large quantities |
| Cart | Realtime change notices above the cart and a "Remover cupom" link | Not designed; needed to explain changes and undo a coupon |
| Cart | The card's cart action adds one unit of the cheapest available edition | The card has no edition picker |
| Checkout | Required fields follow the design's asterisks, including referral code and ENS name; name, username, e-mail and wallet are prefilled from the profile and primary wallet | "Validar os campos do layout" (spec §3) |
| Checkout | The layout's "Tipo de carteira" select and the "Carteira e rede" radios edit the same value (wallet provider); "Usar outra carteira?" reveals the saved-wallet list | The design shows both controls |
| Checkout | "Conectar carteira" button, connection status and review dialog | Not designed; needed for the connection simulation and the review step (spec §3) |
| Checkout | Mobile shows saved wallets and "Carteira e rede" first (as designed), then the collector form, then the total and confirm button | The mobile design has no form; errors must be visible before confirming |
| Orders | The receipt is a page styled like the designed dialog; pending and refused states use the same card | A receipt needs its own URL to survive refresh; those states are not designed |
| NFT details | The price at the top follows the selected edition (the previous price is shown only for the cheapest edition) | The design shows the price of the selected edition |
| Tooling | oxlint instead of ESLint; MSW pinned to 2.x | oxlint is the Vite template default; `@mswjs/socket.io-binding` 0.2 requires `msw@^2` |
