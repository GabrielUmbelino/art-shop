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
| Tooling | oxlint instead of ESLint; MSW pinned to 2.x | oxlint is the Vite template default; `@mswjs/socket.io-binding` 0.2 requires `msw@^2` |
