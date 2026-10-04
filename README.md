# Kurio — NFT Marketplace

React + TypeScript front end for the NFT marketplace challenge ([requirements](docs/REQUIREMENTS.md)), built from the [Figma layout](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1). The REST API and the Socket.IO server are simulated in the browser with MSW, in development, tests and the deployed demo.

- **Live demo:** https://nft-art-shop.vercel.app · **Repository:** https://github.com/GabrielUmbelino/art-shop
- **How it works:** [ARCHITECTURE.md](ARCHITECTURE.md) · **API and events:** [docs/API.md](docs/API.md) · **Lighthouse:** [lighthouse/REPORT.md](lighthouse/REPORT.md) · **Design reference:** [docs/FIGMA.md](docs/FIGMA.md)

## Setup

Requires Node 24+ and pnpm (pinned in `package.json`; `corepack enable` installs it).

```bash
corepack enable
pnpm install
pnpm exec playwright install chromium   # once, for the E2E tests
pnpm dev                                # http://localhost:5173
```

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` (`.env`) | Starts the MSW mock layer (REST + Socket.IO). On in development and in the demo build. `pnpm dev:nomocks` runs with it off (`.env.nomocks`) |

No secrets or external services are needed.

## Test data

| Account | Password | Notes |
| --- | --- | --- |
| `ana@example.com` | `Collector123` | Primary wallet, 2 favorites |
| `bruno@example.com` | `Collector123` | Primary and secondary wallets |

- **Coupons:** `WELCOME10` (10%), `COLLECTOR25` (25%), `SUMMER20` (expired). Any other code is invalid.
- **Notable NFTs:** `nft-005` has a sold-out `1/10` edition; `nft-014` is sold out.
- **Wallet address for testing:** any `0x` followed by 40 hex characters, e.g. `0x41f0fbe06dba013bc993ffb7eefdd4217c2694a4`.

## Scenarios and reset

The simulated data lives in the browser (`localStorage`) and survives refreshes. Three ways to control it:

- **URL:** `?scenario=<name>` switches scenario and resets the data, e.g. `http://localhost:5173/?scenario=slow`. Opening the same scenario again keeps the data.
- **Panel:** the "Mock:" button at the bottom left picks a scenario or restores the data ("Restaurar dados").
- **Console:** `__mock.reset()`, `__mock.configure({...})`, `__mock.updateEdition(...)`, `__mock.resolveOrder(...)`, `__mock.replay(...)`; see [docs/API.md](docs/API.md#mock-environment).

Scenarios: `default`, `fast`, `empty`, `slow`, `variable-latency`, `out-of-order`, `offline`, `server-error`, `flaky`, `session-expiry`, `price-change`, `sold-out`, `order-timeout`, `payment-refused`, `wallet-rejected`.

## Reproducing the failure flows

| Flow | How |
| --- | --- |
| Skeletons under a slow network | `?scenario=slow` |
| Out-of-order responses | `?scenario=out-of-order`, then change filters quickly: the last choice wins |
| Connection failure / HTTP 5xx, then retry | `?scenario=offline` or `?scenario=server-error`, then "Tentar novamente"; `?scenario=flaky` fails once and recovers |
| Session expired | `?scenario=session-expiry` (sessions last 1 minute), or `__mock.expireSessions()` and open a private page |
| Unauthorized access | Open `/profile`, `/checkout` or `/wallets` signed out |
| Sign-up conflict | Sign up with `ana@example.com` or the username `ana` |
| Invalid / expired coupon | `NOPE` / `SUMMER20` in the cart |
| Price changed or sold out during the purchase | `?scenario=price-change` or `?scenario=sold-out`, or run `__mock.updateEdition('nft-001', 'nft-001-e50', { price: '1.31' })` while on the cart or the review dialog |
| Timeout after the order is created (same order recovered) | `?scenario=order-timeout`, then confirm the purchase |
| Payment refused / confirmed | `?scenario=payment-refused` / `default` |
| Wallet rejects the connection | `?scenario=wallet-rejected` |
| Pending order and a lost connection | `__mock.configure({ orderOutcome: 'manual' })`, buy, then `__mock.configure({ socketOffline: true })`, `__mock.resolveOrder('<order id>', 'confirmed')`, `__mock.configure({ socketOffline: false })`; refresh at any point |
| Duplicate or stale events | `__mock.replay(__mock.events()[0].id)` after newer updates |

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm dev:nomocks` | Development server with / without mocks |
| `pnpm build` / `pnpm preview` | Production (demo) build / serve it on port 4173 |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | TypeScript, oxlint, Prettier |
| `pnpm test:e2e` | Playwright on Chromium, desktop (1440) and mobile (390); HTML report in `playwright-report/`, traces on failure |
| `pnpm test:e2e:update` | Refresh visual baselines (macOS baselines are committed) |
| `pnpm a11y` | axe-core audit of every screen (with `pnpm dev` running) |
| `pnpm lighthouse` | Build + Lighthouse CI (home and NFT detail, mobile and desktop, 3 runs) + `lighthouse/REPORT.md` |

## Deploy

Vercel (`vercel.json` rewrites every route to `index.html`, so direct access and refresh work). The demo build keeps the mocks on.
