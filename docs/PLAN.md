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
| Realtime | `socket.io-client` with `transports: ['websocket']` | MSW intercepts WebSocket; polling would bypass the binding (documented limitation) |
| Session | Opaque bearer token issued by mock API, stored in `localStorage`, sent via Axios interceptor and socket `auth` | Recoverable after refresh, expirable by scenario |
| Passwords | Mock DB stores salted SHA-256 (Web Crypto), never plain text | §3 Account and session |
| Mock activation | `VITE_ENABLE_MOCKS=true` (on in dev and demo/deploy build) | §6 "enabled by configuration" |
| Scenarios | Selected via `?scenario=<name>` (persisted), a small dev panel, and `window.__mock` control API used by Playwright | Deterministic, reproducible |
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
- [ ] **BLOCKED: Figma extraction** (via Figma MCP): list all frames (desktop + mobile), pull design tokens (colors, type scale, spacing, radii, shadows), fonts, and download image assets into `public/assets`. Record the frame → route map in `docs/FIGMA.md`
- [ ] Theme Tailwind + shadcn with the extracted tokens; self-host fonts (`font-display: swap`)
- **Checkpoint:** app boots, empty routes render, typecheck/lint green (done: `e2e/smoke.spec.ts` green on desktop + mobile)
- **Blocker:** the Figma MCP returns "no edit access" for the challenge file, so Figma extraction and theming are on hold. Fix: duplicate the file into a Figma account that has a Full seat and share the new URL, or get edit access to the original. Until then the app uses shadcn's default `radix-nova` theme with Geist.

### Phase 1 — Contracts & mock backend
- [ ] zod contracts for: auth/session, user/profile, NFT (with editions, `version`, price as string), list query + paginated response, favorites, cart, quote, order (status `pending | confirmed | refused`, receipt snapshot), wallets, error envelope `{ code, message, fieldErrors? }`
- [ ] Error codes: `VALIDATION_ERROR` 422, `UNAUTHENTICATED` / `SESSION_EXPIRED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` / `OUT_OF_STOCK` / `PRICE_CHANGED` / `IDEMPOTENCY_CONFLICT` 409, `TRANSIENT` 503
- [ ] Mock DB: seed with ≥ 40 NFTs (varied categories, collections, price ranges, editions incl. sold out), 2+ users, wallets, coupons (valid / invalid / expired); persistence to `localStorage`; `reset()` restores seed exactly
- [ ] REST handlers (§5): auth (signup, login, session, logout), NFTs list (search/filters/sort/page) + detail, favorites, cart (guest cart token + user cart, merge on login), quote, orders (idempotency key: same key+body → same order; same key+different body → 409), profile (+ avatar upload as data URL, password change), wallets
- [ ] Network/scenario layer: latency (fixed/variable), out-of-order responses, timeouts, offline, forced 4xx/5xx per route, session expiry, price change / sold out mid-purchase, order timeout after creation, payment confirmed/refused
- [ ] Socket handlers with `@mswjs/socket.io-binding`: authenticate by handshake token, emit `nft.updated` and `order.updated` **from mock DB changes** (so REST and events never diverge); control API to trigger, duplicate, and replay stale events
- [ ] `window.__mock` control API (scenario select, reset, trigger event, advance order) — exposed only when mocks are enabled
- [ ] `docs/API.md`: endpoints, payloads, errors, event envelope `{ id, type, resourceId, version, occurredAt, payload }`, transport limitations
- **Checkpoint:** handlers covered by a quick smoke spec in Playwright hitting the API through the app's Axios client

### Phase 2 — App shell, client data layer, auth
- [ ] Axios instance: base URL, bearer token, `AbortSignal` from Query, normalise errors into a typed `ApiError`; 401 → session-expired flow
- [ ] Query key factory scoped by user id (`['user', userId, …]`) for private data; QueryClient defaults (staleTime, retry only on `TRANSIENT`/network, no retry on 4xx) — documented
- [ ] Router: root layout (header, footer, toaster, live region), `notFound` route, `beforeLoad` auth guard that redirects to `/login?redirect=…`
- [ ] Auth: signup (validation + email conflict), login (validation, redirect back), session restore on boot, logout and user switch → `queryClient.clear()` of private keys, socket disconnect, guest cart reset
- [ ] Session expiry during navigation and checkout: preserve context (route + checkout draft) and resume after re-login
- [ ] Shared skeleton component with shimmer, fixed dimensions, `prefers-reduced-motion` respected
- **Checkpoint:** E2E #3 (signup/login/expiry/logout/switch) green

### Phase 3 — Catalog & NFT detail
- [ ] Home: highlights section, catalog grid, search, combinable filters, sort, pagination — all in URL search params; filter change resets page; back/forward restores state
- [ ] Queries keyed by params; `placeholderData: keepPreviousData`; abort obsolete requests; empty / error + retry states
- [ ] Mobile filter drawer (focus trap, Esc, return focus)
- [ ] NFT detail: direct access, 404 state, gallery, info, edition selector (unavailable editions disabled with reason), quantity limited by availability, favorite toggle, add to cart
- [ ] Favorites: **optimistic update with rollback** + toast on failure; requires auth (redirect with return)
- **Checkpoint:** E2E #1, #2, #4, #12 green

### Phase 4 — Cart
- [ ] Cart page / drawer: change quantity (bounded), remove, coupon apply/remove (invalid/expired errors), summary (subtotal, discount, network fee, total) **from the quote API**
- [ ] Guest cart persisted across refresh; merged into user cart on login
- [ ] Realtime: `nft.updated` updates catalog, detail and cart caches; cart shows an accessible notice when price/availability changed and re-fetches the quote
- **Checkpoint:** E2E #5 green

### Phase 5 — Checkout, orders, realtime hardening
- [ ] Checkout form (collector data per layout) → wallet & network selection (from saved wallets; simulate connect / reject / disconnect) → review step → submit
- [ ] Before confirm: re-quote; any change in price/availability/coupon/fees blocks submission and asks the user to reconfirm
- [ ] Submission: idempotency key generated per attempt and persisted with the draft; button locked while in flight; timeout → retry with **same** key → recovers same order
- [ ] Pending order state persisted (order id) → on refresh/reconnect, fetch order via REST and resubscribe; `confirmed`/`refused` are terminal
- [ ] Confirmation page only for confirmed orders; receipt renders the order snapshot (tx hash, items, fees, total, simulated explorer link)
- [ ] After confirmation remove only the purchased items/quantities from the cart; on failure keep the cart intact
- [ ] Realtime client hardening: dedupe by event id, ignore `version <= cached version`, drop events for a different user/session, reconcile active resources via REST on `connect`/`reconnect`, clean up listeners on unmount/logout
- **Checkpoint:** E2E #6, #7, #9, #10 green

### Phase 6 — Profile & wallets
- [ ] Profile: edit data, avatar upload/preview, change password (current password check, strength rules), API errors mapped to fields, persists after refresh
- [ ] Wallets: create/edit primary and secondary wallets, address validation, primary uniqueness
- [ ] Mobile layouts for profile, wallets, confirmation (no frame → follow the design system)
- **Checkpoint:** E2E #8 green

### Phase 7 — Visual fidelity, responsiveness, a11y pass
- [ ] Compare every screen against Figma at 390 / 768 / 1440 (Figma MCP screenshots side by side); fix spacing/type/colour drift
- [ ] Keyboard pass on every flow; visible focus; dialog/drawer focus management; labels + `aria-describedby` errors; live region for mutations and realtime notices; non-colour-only states; 200%/400% zoom with no horizontal overflow
- [ ] Out-of-scope links/actions (editorial, support, activity, offers, downloads): disabled or "coming soon" — never fake success
- [ ] Document asset substitutions and a11y deviations in `ARCHITECTURE.md`
- **Checkpoint:** E2E #11 green + visual regression baselines for home, detail, cart, checkout (desktop + mobile) committed

### Phase 8 — Performance & Lighthouse
- [ ] Route-level code splitting, image sizing (`width/height`, `srcset`, modern formats, `loading="lazy"` below the fold, `fetchpriority="high"` for LCP image), font preloading, meta/SEO tags, `robots.txt`
- [ ] Minimise MSW worker start-up cost on first paint (documented, no score-only shortcuts)
- [ ] `lighthouserc.cjs`: home + detail, mobile & desktop, 3 runs each, against `pnpm preview` of the demo build; store HTML/JSON reports, tool versions, environment; report medians + LCP/CLS/TBT in `lighthouse/REPORT.md`; justify any miss
- **Checkpoint:** all targets met or justified

### Phase 9 — Docs & deploy
- [ ] `README.md`: setup, env vars, fictitious credentials, scenario selection & reset, commands, how to reproduce each failure flow
- [ ] `ARCHITECTURE.md`: REST contracts & events (link `docs/API.md`), session policy, cart state, cache/retry/sync policy, REST ↔ Socket.IO reconciliation, limitations, UX decisions, Figma deviations
- [ ] Playwright HTML report + traces on failure configured
- [ ] Deploy to Vercel with mocks enabled; verify direct access + refresh on every route, realtime flows working in production build
- [ ] Final run from a clean clone: `pnpm i && pnpm typecheck && pnpm lint && pnpm test:e2e && pnpm build`
- **Checkpoint:** public URL + repo link ready

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
