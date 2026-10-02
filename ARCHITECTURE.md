# Architecture

Full write-up comes in Phase 9. Contracts and the mock environment are documented in [docs/API.md](docs/API.md).

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
| Tooling | oxlint instead of ESLint; MSW pinned to 2.x | oxlint is the Vite template default; `@mswjs/socket.io-binding` 0.2 requires `msw@^2` |
