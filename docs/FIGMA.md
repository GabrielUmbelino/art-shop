# Design reference

Source: SVG exports of the [Figma file](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1) in `screens/`. The Figma MCP has no access to the file, so every value below was read from those exports: from the SVG source (colors, radii, strokes, embedded images) or from Chromium renders of it (layout, type). Text is outlined in the exports, so font names and sizes are inferred and marked as such.

Brand: **Kurio**. UI language: **Portuguese (pt-BR)**.

## Screens

| Screen | Export | Viewport | Route | Notes |
| --- | --- | --- | --- | --- |
| Home | `home.svg` | 1440 x 3668 | `/` | Hero carousel, catalog with sidebar filters, promo cards, blog, newsletter, footer |
| Home | `home-mobile.svg` | 414 x 896 | `/` | Search bar and filter button, hero card, tabs, 2-column staggered grid, bottom tab bar |
| NFT details | `details.svg` | 1440 x 2246 | `/nft/$id` | Gallery, info, editions, quantity, buy, favorite, tabs (details / reviews), "Mais desta coleção" carousel |
| NFT details | `details-mobile.svg` | 414 x 896 | `/nft/$id` | Back and favorite in the top bar, sticky quantity and "Comprar NFT" bar |
| Cart | `kart.svg` | 1440 x 1754 | `/cart` | Item table, summary with coupon, "Colecionadores também viram" carousel |
| Cart | `kart-mobile.svg` | 414 x 896 | `/cart` | Item cards, coupon, summary, "Conectar e finalizar" |
| Payment | `payment.svg` | 1440 x 1657 | `/checkout` | Collector form, order summary, wallet provider selection, "Confirmar compra" |
| Payment | `payment-mobile.svg` | 414 x 896 | `/checkout` | Saved wallets ("Carteira conectada", "Trocar carteira"), wallet and network, total |
| Order confirmation | `payment-confirmation.svg` | 1440 x 1657 | `/orders/$id` | Dialog: thank-you illustration, transaction id, date, total, wallet, lines, fee, total, "Ver no Etherscan" |
| Login | `login.svg` | 1440 x 1981 | `/login` | Dialog over home with tabs "Entrar / Criar conta", Google and Facebook buttons |
| Login | `login-mobile.svg` | 414 x 896 | `/login` | Full page |
| Sign up | `register.svg` | 1440 x 1981 | `/signup` | Same dialog, "Criar conta" tab |
| Sign up | `register-mobile.svg` | 414 x 896 | `/signup` | Full page |
| Profile | `profile.svg` | 1440 x 1080 | `/profile` | Account sidebar, profile form, avatar, password change |
| Wallets | `wallets.svg` | 1440 x 1080 | `/wallets` | Same sidebar, primary wallet form, secondary wallet section |

Mobile frames are a single 414 x 896 viewport; content below the fold is not shown.

## Tokens

Implemented in `src/index.css` as shadcn variables plus the design's own roles.

### Colors

Roles were confirmed by sampling pixels in the renders.

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#140D0A` | Page background, input fill |
| `card` / `popover` | `#241612` | Cards, sidebar, item rows, dialogs, footer body |
| `secondary` / `muted` / `accent` | `#2F1D15` | Raised surfaces, hover backgrounds |
| `strip` | `#38220F` | Footer contact strip |
| `border` / `input` | `#3F2319` | Input borders, dividers, outlined boxes |
| (none) | `#55321F` | Darker accents: slider track and outlines |
| `foreground` | `#F5F1EB` | Primary text, headings |
| `muted-foreground` | `#CFB28C` | Body copy, descriptions |
| `subtle` | `#B39463` | Secondary text: token ids, captions, helper text |
| `primary` | `#D28A4C` | Buttons, active pagination, active sidebar bar, focused borders |
| `primary-foreground` | `#140D0A` | Text on primary buttons |
| `highlight` / `ring` | `#E89B55` | Prices, active nav item and underline, links, focus ring |
| `required` / `destructive` | `#F0805F` | Required-field asterisk, errors |

Contrast on the page background is above 4.5:1 for every text color, including `subtle` on `card` (about 6:1). Brand colors in the exports (Google, Facebook and the social icons) are only used inside their logos.

### Typography (inferred)

- **Family:** Roboto Mono everywhere, judged from the glyphs (slashed zero, `a`/`g` shapes). Self-hosted with `@fontsource-variable/roboto-mono`.
- **Weights:** 400 for body text, 500 to 700 for headings, buttons and prices.
- **Tracking:** body copy has slight positive tracking (about 0.02 to 0.05em).

Approximate desktop sizes, measured from renders (±1px):

| Use | Size / weight |
| --- | --- |
| Hero heading (uppercase) | 44px / 700 |
| NFT title on details | 28px / 700 |
| Price on details | 20px / 700 |
| Section titles ("Perfil do colecionador", "Resumo da carteira") | 16-18px / 700 |
| Nav, labels, item names, prices in lists | 14-15px / 400-700 |
| Body copy, inputs, placeholders | 13px / 400 |
| Captions ("Taxa estimada", "ID do token") | 11-12px / 400 |

### Shape and layout

- **Radii:** 4.5px for buttons and inputs, 8px for small cards, 16px for artwork and large cards. Pills and quantity buttons are fully rounded. `--radius` is 8px.
- **Strokes:** 1.5px for icons and outlined controls, 1px for dividers.
- **Desktop:**
  - 1440px frame with a 1200px content column (120px side margins).
  - Header is 68px with a bottom divider. Account pages use a sidebar about 310px wide.
  - Catalog: 310px filter sidebar plus a 3-column grid.
- **Mobile:** 414px frame with about 18px side padding and a bottom tab bar.
- **Breakpoints:** only 414 and 1440 are designed. The spec also requires 390 and 768.

## Assets

| File | Content |
| --- | --- |
| `public/assets/nfts/ape-emerald-{480,960}.avif`, `-960.jpg` | Brown ape, sunglasses, green varsity jacket |
| `public/assets/nfts/ape-nomad-*` | Gray ape, bucket hat, purple hoodie |
| `public/assets/nfts/ape-ivory-*` | Black ape, ivory blazer |
| `public/assets/nfts/ape-golden-*` | Golden ape with headphones |

- **Artwork:** the exports contain only these four images, each a 1254px PNG of about 2 MB. They were converted with `sips` to AVIF (480 and 960px) plus a 960px JPEG fallback. All catalog NFTs reuse them, as the design does.
- **Icons:** line icons at a 1.5px stroke match `lucide-react` (search, cart, heart, user, log-in, trash, chevrons, eye-off, map-pin).
- **Not yet extracted:** brand marks (Google, Facebook, social networks, wallet providers) and the "Thank you" envelope illustration. They will be extracted as SVG when those components are built.
- **Creator avatars** (`public/assets/creators/`) are placeholders. The design shows no creator images.

## Components

| Component | Where | Variants and states shown |
| --- | --- | --- |
| Header | All desktop | Logo, nav (Início, Mercado, Criadores, Aprenda) with active underline, search, cart with count badge, "Entrar" button |
| Bottom tab bar | Mobile home | Home, favorites, center action, cart, profile |
| Breadcrumb | Details, cart, payment | `Início / Mercado / ...` |
| NFT card | Catalog, carousels | Image, name, price; struck-through previous price; "RARO" badge; hover actions (add to cart, favorite, quick view); favorite toggle on mobile |
| Filter sidebar | Home | Collections with counts, price range slider plus "Aplicar", networks with counts |
| Catalog tabs and sort | Home | "Todos os NFTs / Novos lançamentos / Em alta"; "Ordenar por: Listados recentemente" |
| Pagination | Home | Numbered pages, active page, next arrow |
| Featured card | Home sidebar | "NFT em destaque - Oferta limitada" |
| Gallery | Details | Thumbnails, main image, zoom button |
| Edition pills | Details | `1/1`, `1/10`, `1/50`, `ABERTA`; selected (outlined) |
| Quantity stepper | Details, cart | Round minus and plus buttons around a value |
| Buttons | All | Primary filled, outlined (Favoritar), text link (Continuar explorando) |
| Inputs | Forms | Label with required asterisk, text input, select, `.eth` suffix select, password with visibility toggle, textarea, radio |
| Order summary | Cart, payment, confirmation | Subtotal, launch discount, network fee with "Taxa estimada", total |
| Coupon field | Cart, payment | Input with attached "Aplicar" button; "Tem um código promocional? Aplique aqui" |
| Wallet option | Payment | Radio rows for MetaMask, WalletConnect and Coinbase Wallet; saved wallet rows with network on mobile |
| Dialog | Login, sign-up, confirmation | Close button, primary bottom border accent |
| Account sidebar | Profile, wallets | Dados do perfil, Carteiras, Atividade, Lista de interesse, Ofertas, Arquivos baixados, Suporte, Sair; active item with left bar |
| Footer | Desktop pages | Feature band (3 items plus newsletter), contact strip, link columns, social icons, compatible wallets, copyright |

## Not in the design

These follow the same visual language and are documented in `ARCHITECTURE.md` as they are built:

- Loading skeletons, empty results, error and retry states, background refresh.
- Tablet (768px) layouts.
- Mobile profile, wallets and confirmation.
- Mobile content below the first viewport.
- Not-found page and non-existent NFT.
- Pending and refused order states.
- Empty cart.
- Price and availability change notices.
- Session-expired prompt.
- Reviews tab content.

## Gaps between the design and the Phase 1 contracts

Decisions to take before the screens are built:

| Area | Design | Current contract / seed |
| --- | --- | --- |
| Categories | 9: Arte digital, Fotografia, Música, Arte 3D, Colecionáveis, Generativa, Jogos, Assinaturas, Utilidade | 6 (`art`, `photography`, `music`, `gaming`, `collectibles`, `3d`) |
| Network | NFTs belong to a network; catalog filter by Ethereum / Polygon / Solana | No network on NFTs; checkout networks are ethereum / polygon / base |
| Catalog tabs | Todos / Novos lançamentos / Em alta | No "new" or "trending" filter |
| Price | Optional previous price (struck through), "RARO" badge | Not modeled |
| Editions | Named by supply: `1/1`, `1/10`, `1/50`, `ABERTA` (open) | Standard / Limited / Artist Proof |
| NFT details | Token id, collection, attributes, rating with review count, contract and royalty text | Not modeled (except collection) |
| Sign up | Username, e-mail, password, confirm password | Requires name, username, e-mail, password |
| Profile | Display name, username, e-mail, ENS name (`.eth`), wallet nickname, avatar, password change | Name, username, e-mail, bio, avatar |
| Wallets | Display name, nickname, network, profile name, address, ENS or secondary address, wallet type, referral code, e-mail, ENS name | Slot, label, provider, address |
| Checkout collector | The wallet form's fields plus "Usar outra carteira?" and an optional note | Full name, e-mail |
| Social login | Google and Facebook buttons | Out of scope; must not appear to work |
