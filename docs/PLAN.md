# Implementation Plan — NFT Marketplace

Source of truth for requirements: `docs/REQUIREMENTS.md` (English translation of the challenge spec). Section references like §6 point to that spec.
Visual source of truth: [Figma file](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done. Each phase ends with a checkpoint: typecheck, lint and the tests written so far must pass before moving on.

---

## 0. Key technical decisions

| Topic | Decision | Why |
| --- | --- | --- |
| Build | Vite 8 + React 19 + TypeScript 7 (strict) | Fast, first-class Vercel support, MSW friendly |
| Package manager | pnpm (lockfile committed) | Reproducible clean checkout |
| Routing | TanStack Router, file-based routes, search params validated with zod | Typed URL state for search/filters/sort/page (§3, §4) |
| Remote state | TanStack Query v5 | Queries, mutations, optimistic updates, cache sync |
| HTTP | Single Axios instance in `src/api/http.ts` with auth + error-normalising interceptors | All REST goes through it (§4) |
| Contracts | zod schemas in `src/contracts/` shared by client **and** MSW handlers; TS types inferred from them | Typed transport ↔ state ↔ UI, one definition |
| Styling | Tailwind CSS v4 + shadcn/ui, themed with Figma tokens | Required stack, adapted to the layout (§8) |
| Forms | react-hook-form + zod resolver (shadcn Form) | Field-level errors + API errors mapped to fields |
| Money | ETH as decimal **strings** on the wire; math with `big.js` via a `src/lib/money.ts` helper; never `number` | Precision requirement (§3 Cart) |
| Mocks | MSW 2.x (REST; pinned to 2.x because `@mswjs/socket.io-binding` 0.2 peers on `msw@^2`) + `@mswjs/socket.io-binding` (events), backed by one in-memory mock DB persisted to `localStorage` | Consistent state across resources, survives refresh, resettable (§6) |
| Realtime | `socket.io-client` with `transports: ['websocket']` on path `/realtime/` | MSW intercepts WebSocket; polling would bypass the binding. MSW strips the default `/socket.io/` prefix before matching, which would collide with Vite's HMR socket (documented in `docs/API.md`) |
| Session | Opaque bearer token issued by mock API, stored in `localStorage`, sent via Axios interceptor and socket `auth` | Recoverable after refresh, expirable by scenario |
| Passwords | Mock DB stores salted SHA-256 (Web Crypto), never plain text | §3 Account and session |
| Mock activation | `VITE_ENABLE_MOCKS=true` (on in dev and demo/deploy build) | §6 "enabled by configuration" |
| Scenarios | Selected via `?scenario=<name>` (persisted), a small dev panel (Phase 2, with the app shell), and `window.__mock` control API used by Playwright | Deterministic, reproducible |
| Tests | Playwright (Chromium, desktop 1440 + mobile 390), visual baselines committed | §9 |
| Audit | `@lhci/cli` with versioned `lighthouserc.cjs`, 3 runs, median | §10 |
| Deploy | Vercel, SPA rewrite to `index.html` | §12 |

## 1. Target folder structure

```
src/
  app/            # providers (QueryClient, Router, Socket, Toaster), error boundaries
  routes/         # TanStack Router file routes (__root, index, nft.$id, cart, checkout, orders.$id, login, signup, profile, wallets, 404)
  features/
    catalog/      # hooks, components, search-param schema
    nft/          # detail, gallery, edition picker, quantity
    favorites/
    cart/
    checkout/     # form, wallet/network step, review, submission state machine
    orders/       # receipt, pending/confirmed/refused states
    auth/         # login, signup, session hook, guards
    profile/
    wallets/
  api/            # http.ts (axios), endpoints per resource, query keys, error types
  contracts/      # zod schemas + inferred types (REST + socket events)
  realtime/       # socket client, event dedupe/version guard, reconciliation
  components/ui/  # shadcn components (themed)
  components/     # shared app components (Header, Footer, Skeletons, PriceTag…)
  lib/            # money, idempotency, storage, a11y announcer
  mocks/
    db/           # mock DB, seed fixtures, persistence, reset
    handlers/     # REST handlers per resource
    socket/       # socket.io-binding handlers, event emitter tied to db changes
    scenarios/    # named deterministic scenarios + network conditions
    browser.ts    # worker setup
e2e/              # Playwright specs, fixtures, visual baselines
lighthouse/       # config + reports
docs/             # REQUIREMENTS.md, PLAN.md, API.md (contracts & events)
```

---

## Phases

### Phase 0 — Groundwork
- [x] `git init`, `.gitignore`
- [x] Move the spec to `docs/REQUIREMENTS.md` (translated to English) so the solution can have its own `README.md`
- [x] Scaffold Vite React-TS with pnpm; strict `tsconfig`; oxlint (react, typescript, jsx-a11y plugins; Vite template default) + Prettier
- [x] Install stack: TanStack Router (+ vite plugin), TanStack Query (+ devtools), Axios, Tailwind v4, shadcn/ui init, MSW, socket.io-client, @mswjs/socket.io-binding, zod, react-hook-form, big.js, Playwright, @lhci/cli
- [x] Scripts: `dev`, `dev:nomocks`, `build`, `preview`, `typecheck`, `lint`, `format`, `test:e2e`, `test:e2e:update`, `lighthouse` (config lands in Phase 8). Mock reset is exposed in the browser (`window.__mock`, Phase 1), not as a script
- [x] **Design extraction** from the SVG exports in `screens/` (the Figma MCP has no access to the file): frames, tokens, fonts, assets into `public/assets`, frame → route map, components and design/contract gaps in `docs/FIGMA.md`
- [x] Theme Tailwind + shadcn with the extracted tokens (dark only); self-host Roboto Mono (`@fontsource-variable/roboto-mono`, `font-display: swap`)
- **Checkpoint:** app boots, empty routes render, typecheck/lint green (done: `e2e/smoke.spec.ts` green on desktop + mobile)
- **Design source:** `screens/*.svg` (exported from Figma) replaces the Figma MCP, which returns "no edit access". Open: confirm the font (inferred as Roboto Mono) and resolve the design/contract gaps listed in `docs/FIGMA.md` before Phase 2

### Phase 1 — Contracts & mock backend
- [x] zod contracts for: auth/session, user/profile, NFT (with editions, `version`, price as string), list query + paginated response, favorites, cart, quote, order (status `pending | confirmed | refused`, receipt snapshot), wallets, error envelope `{ code, message, fieldErrors? }`
- [x] Error codes: `VALIDATION_ERROR` / `COUPON_INVALID` / `COUPON_EXPIRED` 422, `UNAUTHENTICATED` / `SESSION_EXPIRED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` / `OUT_OF_STOCK` / `QUOTE_CHANGED` / `IDEMPOTENCY_CONFLICT` / `WALLET_REJECTED` / `WALLET_NOT_CONNECTED` 409, `TRANSIENT` 503. A single `QUOTE_CHANGED` (carrying the new quote) covers price, availability, coupon and fee changes at submission
- [x] Mock DB: seed with ≥ 40 NFTs (varied categories, collections, price ranges, editions incl. sold out), 2+ users, wallets, coupons (valid / invalid / expired); persistence to `localStorage`; `reset()` restores seed exactly
- [x] REST handlers (§5): auth (signup, login, session, logout), NFTs list (search/filters/sort/page) + detail, favorites, cart (guest cart token + user cart, merge on login), quote, orders (idempotency key: same key+body → same order; same key+different body → 409), profile (+ avatar upload as data URL, password change), wallets
- [x] Network/scenario layer: latency (fixed/variable), out-of-order responses, timeouts, offline, forced 4xx/5xx per route, session expiry, price change / sold out mid-purchase, order timeout after creation, payment confirmed/refused
- [x] Socket handlers with `@mswjs/socket.io-binding`: authenticate by handshake token, emit `nft.updated` and `order.updated` **from mock DB changes** (so REST and events never diverge); control API to trigger, duplicate, and replay stale events
- [x] `window.__mock` control API (scenario select, reset, trigger event, advance order) — exposed only when mocks are enabled
- [x] `docs/API.md`: endpoints, payloads, errors, event envelope `{ id, type, resourceId, version, occurredAt, payload }`, transport limitations
- **Checkpoint:** `e2e/mock-api.spec.ts` covers every resource, scenario hooks, idempotency, socket delivery/scoping/duplicates/reconnect and reset. REST is called with `fetch` from the page (through the MSW service worker); sockets use the real `socket.io-client` bundle injected into the page. The app's Axios client arrives in Phase 2, so its coverage moves there (done: 32/32 green, twice in a row)

### Phase 2 — App shell, client data layer, auth
- [x] Axios instance (`src/api/http.ts`): base URL, bearer token, `AbortSignal` from Query, 10 s timeout, errors normalised into a typed `ApiError` (`NETWORK`/`TIMEOUT` for requests without an answer); a 401 ends the session; `paramsSerializer: { indexes: null }`. Guest `X-Cart-Id` moves to Phase 4 with the cart
- [x] Private query keys under `['private', userId, …]` (`src/api/keys.ts`); QueryClient defaults: 30 s staleTime, retry only `TRANSIENT`/`NETWORK`/`TIMEOUT` (max 2), no mutation retries
- [x] Router: root layout (skip link, header, footer, mobile tab bar, toaster, live region, devtools in dev), 404 page, pathless `_authenticated` layout whose guard redirects to `/login?redirect=…`
- [x] Auth: sign-up (validation, confirm password, conflicts on fields), login (validation, invalid credentials, redirect back), session restore on refresh, logout and user switch drop all private cache and replace the socket. Login and sign-up are a dialog over home on desktop and full pages on mobile, as designed. Guest cart reset/merge moves to Phase 4
- [x] Session expiry during navigation: toast, redirect to `/login?redirect=…&reason=expired`, return after login. The checkout draft part lands with checkout in Phase 5
- [x] Shared skeleton with shimmer, `prefers-reduced-motion` respected
- [x] Mock scenario panel (`src/mocks/panel.tsx`), mounted outside the app tree; hidden in tests
- **Checkpoint:** `e2e/auth.spec.ts` (E2E #3) and the updated smoke spec green on desktop and mobile

### Phase 3 — Catalog & NFT detail
- [x] Contracts aligned with the design: 9 categories, network per NFT (Ethereum / Polygon / Solana), tabs, previous price, rarity, editions `1/1`/`1/10`/`1/50`/`Aberta`, token id, attributes, rating and reviews; `GET /nfts/facets`; first 9 seed NFTs = the design's grid
- [x] Home: hero, catalog grid, search (header field on desktop, search bar on mobile), combinable filters with counts, price range, tabs, sort, pagination, all in URL search params; filter change resets page; back/forward and refresh restore state; promo cards and blog teasers
- [x] Queries keyed by params, `placeholderData: keepPreviousData`, abort on change (out-of-order safe); skeleton, empty, error + retry, background refresh states; results announced to screen readers
- [x] Mobile filter sheet (focus trap, Esc, return focus via Radix)
- [x] NFT detail: direct access, 404 state, gallery with zoom, info, edition pills (sold out disabled, edition in URL), quantity limited by availability and per-order cap, favorite, share links, details/reviews tabs, "Mais desta coleção"; mobile top bar and purchase panel. "Comprar" is wired in Phase 4
- [x] Favorites: optimistic toggle with rollback + toast, signed-out redirect with return, favorites page
- **Checkpoint:** `catalog.spec.ts` (#1, #12), `nft-detail.spec.ts` (#2), `favorites.spec.ts` (#4), smoke spec now also checks for horizontal overflow; 60/60 green on desktop and mobile (twice)

### Phase 4 — Cart
- [x] Cart item carries the token id (shown in the cart design)
- [x] Cart data layer: guest cart id (`X-Cart-Id`), cart and quote queries, mutations (add, quantity, remove, coupon), merge into the user cart on login
- [x] Cart page (desktop table, mobile cards): quantities bounded by availability, removal, coupon apply/remove with invalid/expired errors, summary (subtotal, discount, network fee, total) **from the quote API**, empty state, "Colecionadores também viram"
- [x] Wire "Comprar" (details page), card cart action and the header/tab bar cart badge
- [x] Realtime: `nft.updated` updates catalog, detail and cart caches with dedupe and version guard; reconcile with REST on reconnect; cart shows an accessible notice when price/availability changed and re-fetches the quote
- [x] App modules are imported after the mocks start (engine.io-client captures `WebSocket` at import; found by the cart realtime test)
- **Checkpoint:** `cart.spec.ts` (E2E #5 plus realtime in the cart) green; full suite 69/69 on desktop and mobile (twice)

### Phase 5 — Checkout, orders, realtime hardening
- [x] Order contract follows the payment layout: collector (display name, username, profile name, e-mail, ENS name, referral code, optional secondary address and note) and wallet provider
- [x] Orders data layer: wallets query, connect/disconnect, order query, create with idempotency key persisted per attempt and own timeout; checkout draft persisted per user (survives refresh and session expiry)
- [x] Checkout page (desktop and mobile layouts): collector form with layout validation, saved wallet selection ("Usar outra carteira?"), provider and network, connect / reject / disconnect simulation, summary from the quote
- [x] Review and submit: review dialog with a fresh quote; any change (realtime or `QUOTE_CHANGED` on submit) shows the new values and requires confirming again; button locked while in flight; timeout retries with the same key and recovers the same order
- [x] Order page: pending (survives refresh and reconnect), refused (cart kept), confirmed receipt from the order snapshot only (tx id, date, total, wallet, lines, fee, explorer link)
- [x] Realtime `order.updated`: dedupe, version guard, applies only to the session's cache; confirmed orders refresh the cart (bought units removed by the API)
- **Checkpoint:** `checkout.spec.ts` (E2E #6, #7, #9, #10 plus wallet reject/disconnect) green; full suite 87/87 on desktop and mobile (twice)

### Phase 6 — Profile & wallets
- [x] Contracts follow the layouts: profile gets ENS name and wallet nickname (bio removed); wallets carry network and the collector profile (display/profile name, e-mail, ENS, referral code, secondary address); shared field rules in `contracts/fields.ts`; checkout prefills from the selected wallet
- [x] Account layout: sidebar (Dados do perfil, Carteiras, Lista de interesse, out-of-scope items as "Em breve", Sair) on desktop, scrolling tabs on mobile
- [x] Profile: edit data (layout fields), avatar upload/preview/remove (type and size checked), change password (current, new, confirmation), API errors mapped to fields, header and session updated, persists after refresh
- [x] Wallets: primary and secondary forms (layout fields), create and edit, "Igual à carteira principal", address/ENS validation, API conflicts on fields, persists after refresh
- [x] Shared `EnsInput` (".eth" suffix box) for profile, wallets and checkout
- **Checkpoint:** `account.spec.ts` (E2E #8: profile, avatar, password, wallets) green; full suite 95/95 on desktop and mobile (twice)

### Phase 7 — Visual fidelity, responsiveness, a11y pass
- [x] Global focus-visible outline, reduced-motion scrolling, devtools hidden under automation
- [x] Automated accessibility audit (`pnpm a11y`: axe-core from the Lighthouse install) on every screen, desktop and mobile: 4 rule violations found and fixed (definition lists, heading order, link distinguishable only by color, duplicate landmark), now 0
- [x] Responsive pass at 320 (400% zoom of 1280), 390, 768 and 1440 px on every route, public and private; overflow guarded by `responsive.spec.ts`. Fixed: footer grid at 320, cart and account layouts at 768 (two columns from 1024), tablet header, hero and footer
- [x] Keyboard and focus E2E (#11, `keyboard.spec.ts`): skip link, visible focus, header search, catalog filters and cards, login dialog trap + Escape, zoom dialog and mobile sheet return focus, form errors linked (aria-describedby, role=alert) and focused
- [x] Visual regression baselines (`visual.spec.ts`) for home, detail, cart (the design's three items) and checkout, desktop + mobile; stable data, animations off, lazy images settled; macOS baselines committed (`-darwin`)
- [x] Out-of-scope links/actions show "Em breve" (done since Phase 2)
- [x] Asset substitutions and a11y deviations documented in `ARCHITECTURE.md`
- [x] Fixed on the way: active tab color (shadcn `dark:` variants outranked the design classes), flaky keyboard test waiting for the catalog
- **Checkpoint:** E2E #11 green + baselines committed; full suite 120/120 on desktop and mobile

### Phase 8 — Performance & Lighthouse
- [x] `lighthouserc.cjs` + `pnpm lighthouse`: home and NFT detail, mobile and desktop, 3 runs each, against `pnpm preview` of the demo build (mocks on, default scenario); reports in `lighthouse/reports/<profile>`, medians and environment in `lighthouse/REPORT.md` (`scripts/lighthouse-report.mjs`)
- [x] Baseline (before changes): mobile 81 / 63 performance, desktop 98 / 85; accessibility 96-100; best practices 100; SEO 92
- [x] SEO: `robots.txt`. Accessibility: 24px carousel dot targets. CLS: gallery width on mobile (`self-start` only on desktop) and skeleton space for tabs/related NFTs (detail CLS 0.36 / 0.24 → 0)
- [x] Loading: app downloaded in parallel with the mock layer (only socket.io-client is lazy), vendor chunk for shared libraries (56 → 45 JS requests), brand marks split, route loaders prefetch page data, self-hosted preloaded font subset, `kurio:mocks-ready` / `kurio:render` user timings
- [x] Final measurement in `lighthouse/REPORT.md`: desktop 99/99 performance; accessibility, best practices and SEO 100 everywhere; mobile performance 81/81 (LCP ~4.4 s), below target and analysed (mock layer download + service worker activation + mock latency on API-dependent LCP images)
- [x] Mock latency sequences restart on reset/configure (deterministic out-of-order scenario with route prefetching)
- **Checkpoint:** all targets met except mobile performance, justified in `lighthouse/REPORT.md`; full suite 120/120 (twice)

### Phase 9 — Docs & deploy
- [x] `README.md`: setup, env vars, fictitious credentials, scenario selection & reset, commands, how to reproduce each failure flow
- [x] `ARCHITECTURE.md`: REST contracts & events (link `docs/API.md`), session policy, cart state, cache/retry/sync policy, REST ↔ Socket.IO reconciliation, limitations, UX decisions, Figma deviations
- [x] Playwright HTML report + traces on failure configured
- [x] Deploy to Vercel with mocks enabled: https://nft-art-shop.vercel.app (`vercel.json` SPA rewrites, `.vercelignore`). Verified on production: direct access and refresh on every route, realtime price notice in the cart, full purchase confirmed through `order.updated`; verify direct access + refresh on every route, realtime flows working in production build
- [x] Final run from a clean clone: `pnpm i --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm build && CI=1 pnpm test:e2e` (123/123). Production build checked with `pnpm preview`: direct access and refresh on every route, realtime notice in the cart
- **Checkpoint:** public URL https://nft-art-shop.vercel.app + repo https://github.com/GabrielUmbelino/art-shop (private: make it public or share it with the evaluators)

---

## E2E coverage map (§9)

| # | Scenario | Phase |
| --- | --- | --- |
| 1 | Search, combined filters, sort, pagination, history restore | 3 |
| 2 | Direct detail access, non-existent NFT | 3 |
| 3 | Signup, login, session expiry, logout, user switch | 2 |
| 4 | Favorites incl. mutation failure + rollback | 3 |
| 5 | Cart quantities, removal, coupon, persistence after refresh/login | 4 |
| 6 | Full purchase catalog → confirmed receipt | 5 |
| 7 | Payment refused, double click, timeout recovering same order | 5 |
| 8 | Profile, avatar, password, wallets + validation errors | 6 |
| 9 | Price/availability change via Socket.IO during checkout | 5 |
| 10 | Duplicate/stale events, disconnect, pending order resume | 5 |
| 11 | Keyboard navigation, dialog focus, form validation | 7 |
| 12 | Skeletons under slow network, failure feedback, retry recovery | 3 |

Every test starts from `__mock.reset()` + a named scenario; time-sensitive tests use `page.clock` and explicit event triggers.

## Risks / open points

- `@mswjs/socket.io-binding` maturity — verify early in Phase 1 with a spike; fallback is a hand-rolled Engine.IO/Socket.IO frame handler on top of MSW's `ws` API (still exercising `socket.io-client`).
- MSW in the production bundle may cost Lighthouse performance; measure in Phase 8 and document.
- Figma may lack some states (loading, empty, error, mobile profile/wallets) — design them from existing tokens/components and list them in `ARCHITECTURE.md`.
