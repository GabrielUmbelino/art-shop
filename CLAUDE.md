# CLAUDE.md

NFT Marketplace frontend challenge: React + TypeScript app with fully simulated backend (MSW REST + Socket.IO events). No real blockchain, wallets or payments.

- Requirements: `docs/REQUIREMENTS.md` (English translation of the original spec). Read the relevant section before starting a feature.
- Work plan: `docs/PLAN.md`. Follow its phases in order; update checkboxes (`[~]` when starting, `[x]` when done) as you go.
- Design: [Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1). Frame → route map lives in `docs/FIGMA.md`.

## Workflow

- Before building or changing any screen, pull the matching Figma frame (desktop and mobile) with the Figma MCP tools and match tokens, spacing and composition. Don't guess visuals.
- Work one phase at a time. At each phase checkpoint, run `pnpm typecheck && pnpm lint` plus the related Playwright specs, then stop and summarise for the user before starting the next phase.
- Ask before: adding a dependency outside the stack in `docs/PLAN.md`, deviating from Figma, changing a contract that is already in use, pushing to a remote, or deploying.
- Record every Figma deviation, asset substitution, a11y adjustment or known limitation in `ARCHITECTURE.md` when it happens, not at the end.
- Code, comments, commits and docs in English. UI copy follows the Figma.

## Commands

```bash
pnpm dev               # dev server with MSW mocks (VITE_ENABLE_MOCKS=true)
pnpm dev:nomocks       # dev server without mocks
pnpm build             # production/demo build (mocks enabled via env)
pnpm preview           # serve the build
pnpm typecheck         # tsc -b (app, node configs, e2e)
pnpm lint              # oxlint
pnpm format            # prettier (code only, markdown is ignored)
pnpm test:e2e          # Playwright (Chromium, desktop + mobile)
pnpm test:e2e:update   # refresh visual baselines (only when a visual change is intended)
pnpm lighthouse        # LHCI: home + detail, mobile + desktop, 3 runs
```

## Stack (all mandatory, all must be used for real)

React · TypeScript strict · TanStack Router · TanStack Query · Axios · Tailwind CSS v4 · shadcn/ui · MSW · socket.io-client + @mswjs/socket.io-binding · Playwright · Lighthouse. Plus zod, react-hook-form, big.js.

## Hard rules

These come straight from the spec; breaking some of them disqualifies the submission.

1. **No fake data outside `src/mocks/`.** Components, hooks and the Axios client never contain fixture data, `if (mock)` branches or alternative business paths.
2. **All REST goes through the shared Axios instance** (`src/api/http.ts`), called from TanStack Query hooks. No `fetch` in features.
3. **All realtime goes through `socket.io-client`.** Never simulate an event by calling a setter, callback or `queryClient.setQueryData` from the UI or tests. Tests trigger events through the mock socket server.
4. **Mock events come from mock DB changes**, so REST responses and socket events always agree.
5. **Contracts live in `src/contracts/` as zod schemas**, shared by the client and the MSW handlers. Types come from `z.infer`; don't redeclare them.
6. **ETH amounts are decimal strings.** Do math only through `src/lib/money.ts` (big.js). Never `parseFloat`/`Number` on money. Quantities are integers.
7. **The quote from the API is the source of truth** for totals. The client displays it and doesn't recompute business totals.
8. **A confirmed order screen only appears for an order the mock confirmed.** Receipts render the order snapshot, never live catalog data.
9. **Order creation sends an idempotency key**, persisted with the checkout attempt and reused on retry.
10. **Private data is scoped by user.** Query keys for private resources include the user id. Logout or user switch clears private cache, disconnects the socket and removes listeners.
11. **Realtime events are idempotent.** Dedupe by event `id`, ignore `version <=` cached version, drop events for another user/session, reconcile with REST on reconnect.
12. **No plain-text passwords**, not even in the mock DB (salted hash).
13. **Out-of-scope actions never pretend to work.** Make them disabled or clearly marked.

## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
4. When hitting issues, always identify root cause before trying a fix. Do not guess. Prove with evidence, then fix the root cause.

## Conventions

- Feature folders under `src/features/<feature>/` hold that feature's hooks, components and schemas. Shared UI goes in `src/components/`, shadcn primitives in `src/components/ui/`.
- Query keys come from a factory per resource in `src/api/` (e.g. `nftKeys.list(params)`). No inline array keys.
- URL state (search, filters, sort, page) is defined by a zod `validateSearch` schema on the route. Changing a filter resets `page`.
- Every data-dependent component has loading (shimmer skeleton with fixed dimensions, honours `prefers-reduced-motion`), empty, error-with-retry and background-refresh states.
- Forms use react-hook-form + zod. Map API `fieldErrors` onto fields with `setError`. Errors are linked with `aria-describedby`.
- Accessibility is part of "done": keyboard reachable, visible focus, focus trapped and restored in dialogs/drawers, `alt` on meaningful images, and mutation/realtime feedback through the live region and toasts.
- Playwright specs live in `e2e/`. Each one starts with a mock reset plus a named scenario and asserts on the UI and on operation results. Use `page.clock` and explicit event triggers for anything time-sensitive.
- Prefer small, typed modules. No `any`. Use `unknown` plus zod parsing at the boundaries.


## Working documentation

All documents for planning and executing this project will be in the docs/ directory.
Please review the docs/PLAN.md document before proceeding.