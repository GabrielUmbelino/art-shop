# NFT Marketplace

Build the **NFT Marketplace** in React and TypeScript, following the [Figma layout](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

The challenge evaluates visual fidelity, interaction quality, API integration, asynchronous state management, real time, accessibility and performance.

## 1. Scope

Deliver the discovery, purchase and collector account flows, with desktop and mobile versions. APIs, authentication, wallets and payments must work with simulated data. Real integrations with blockchain, wallet extensions and payment gateways are out of scope.

The Figma file defines the visual identity and the composition of the screens. This document defines the behaviors and the evaluation scenarios. States that are not designed must follow the same visual pattern.

## 2. Required stack

| Responsibility | Technology |
| --- | --- |
| Interface | React |
| Language | TypeScript |
| Routing | TanStack Router |
| Remote state | TanStack Query |
| HTTP client | Axios |
| Data integration | REST APIs |
| Real time | Socket.IO |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Mocking | MSW |
| E2E tests and visual regression | Playwright |
| Performance and quality audit | Lighthouse |

The technologies must play a real part in the solution. The build tool, project organization and complementary libraries are up to the candidate.

## 3. Screens and flows

| Screen | Required features |
| --- | --- |
| Home | Highlights, catalog, search, filters, sorting and navigation to the NFT |
| NFT details | Gallery, information, edition, quantity, favorites and purchase |
| NFT cart | Quantity editing, removal, coupon and price summary |
| Payment | Collector details, wallet and network selection, review and order submission |
| Order confirmation | Result, transaction identifier, items, fees and total |
| Login | Authentication, validation and return to the previous flow |
| Sign up | Account creation, validation and conflict handling |
| Collector profile | Editing details, avatar and password change |
| Wallets | Creating and editing primary and secondary wallets |

Implement the available desktop and mobile frames. Profile, wallets and confirmation must also work on mobile, even without a specific frame.

Editorial pages, support, activity, offers and downloads are not part of the deliverable. External links and auxiliary actions must behave coherently; out-of-scope actions must not appear to succeed functionally.

### Catalog and detail

- Search, filters, sorting and pagination must make up the URL state and survive refresh and history navigation.
- Filters must be combinable; changing a filter must reset pagination.
- Queries must reflect the parameters sent to the API, handling empty results, failures and out-of-order responses.
- The detail page must support direct access, non-existent NFT, unavailable edition and quantity limit.
- Favorites must persist for the authenticated user.

### Cart

- Add, change and remove items, respecting availability per NFT and edition.
- Keep the cart after refresh and preserve the guest's items when they authenticate.
- Apply and remove a coupon, handling invalid or expired codes.
- Show subtotal, discount, network fee and total consistent with the API response.
- Reflect price and availability changes received while the cart is open.

ETH amounts must travel as decimal strings and keep precision in calculations and display. Quantities are integers. The API quote is the reference for completing the order.

### Payment and confirmation

- Validate the layout's fields and allow review before submission.
- Use the registered wallets, with network selection and simulation of connection, rejection and disconnection.
- Revalidate price, availability, coupon and fees before confirming the purchase. Changes must require a new confirmation from the user.
- Prevent duplicate orders from repeated clicks or resubmissions after a timeout.
- Represent pending, confirmed and refused orders, with recovery after refresh or reconnection.
- Show the confirmation only for an order actually confirmed by the simulation.
- Keep the items on failure; after confirmation, remove from the cart only the purchased items and quantities.

The receipt must reproduce the order snapshot. Later changes to the catalog must not modify its values. Transaction references and explorer links are simulated.

### Account and session

Sign up, login, logout and session are required, integrated with the simulated API. Checkout, profile, wallets, favorites and orders require authentication.

The session must be recoverable after refresh. Handle expiration during navigation and during checkout, preserving the context so the user can resume. Logout and user switching must clear private cached data and the previous session's subscriptions.

Validate the sign up, profile, password and wallet forms, including errors returned by the API. Confirmed changes must persist after refresh. Use fictitious credentials and do not store passwords in plain text.

## 4. Integration and state

Use TanStack Router for routes, search parameters and protection of private flows. Use TanStack Query for queries, mutations and cache synchronization. REST calls must go through Axios.

The solution must ensure:

- typed contracts between transport, state and interface;
- loading, empty, error, success and background update states;
- consistent invalidation after mutations and events;
- cancellation or discarding of stale responses;
- data isolation per user and per query parameters;
- failure recovery without duplicating operations;
- handling of non-existent routes and direct access to every planned screen.

Apply an optimistic update to at least one interaction, with rollback on failure. The cache, retry and synchronization policy must be documented.

## 5. REST contracts

Define and document the contracts used. The minimum resources are:

| Resource | Operations |
| --- | --- |
| Session and account | Sign up, login, session lookup, logout and expiration |
| NFTs | Listing with search/filters/sorting/pagination and detail by identifier |
| Favorites | Lookup, add and remove |
| Cart | Lookup, add, change and remove items |
| Quote | Coupon validation, availability, discounts, fees and total |
| Orders | Idempotent creation and lookup of status and receipt |
| Profile | Lookup, update of details/avatar and password change |
| Wallets | Lookup, creation and update |

Responses must represent validation errors, invalid session, missing permission, non-existent resource, availability conflict and transient failure.

Order mutations must accept an idempotency key. In the simulation, the same attempt must retrieve the same order; reusing the key with different content must produce a conflict.

## 6. Mocking with MSW

Implement the mocks at the network layer, reusing contracts and scenarios across development, demo and tests. Components, hooks and the Axios client must not contain fake responses or alternative business paths.

The mocks must keep consistent state across catalog, favorites, cart, profile, wallets and orders. Local persistence is allowed to support refresh; reset must fully restore a known scenario.

### Simulating network conditions and failures

Simulate network conditions and failures with MSW, including slowness, variable latency, timeouts, connection unavailability and HTTP error responses. Scenarios must be configurable and reproducible, so that loading, error feedback and interface recovery can be evaluated.

Provide fixtures with enough variety to exercise filters and pagination, at least two users, and deterministic scenarios for:

- success and empty result;
- variable latency and out-of-order responses;
- connection failures and HTTP 4xx/5xx responses;
- expired session and unauthorized access;
- sign-up conflict or form validation conflict;
- invalid or expired coupon;
- price changed or edition sold out during purchase;
- timeout after order creation, with recovery through idempotency;
- payment confirmed and payment refused.

Also use MSW to simulate the events, with an integration compatible with the Socket.IO protocol, such as [@mswjs/socket.io-binding](https://github.com/mswjs/socket.io-binding). Document the transport used and its limitations in the mock environment.

The scenarios must exercise `socket.io-client`. Replacing the socket with direct calls to setters, callbacks or the cache does not meet the requirement.

The mock layer must be enabled by configuration and be available in the demo build. Changes to the simulated data must be reflected in both the REST responses and the corresponding events.

## 7. Real time with Socket.IO

Implement at least the following events:

| Event | Expected behavior |
| --- | --- |
| `nft.updated` | Update price and availability in the catalog, detail and cart |
| `order.updated` | Update the order status and show confirmation or refusal |

Events must carry a stable identity, the affected resource and a version. The client must tolerate duplicates and old events, without regressing a newer state or reapplying effects.

After reconnection, reconcile the active resources with the REST API. Events from a previous session must not update another user's data. Listeners and subscriptions must be released when their lifecycle ends.

Implement the scenario:

1. An NFT is in the cart.
2. Its price or availability changes during navigation.
3. The interface reports the change and updates the summary.
4. Checkout prevents confirmation with an outdated quote.

A connection interruption while the order is pending must also work. After reconnecting or reloading the page, the user must recover their state without creating another purchase. Confirmed or refused orders are terminal.

## 8. Interface, responsiveness and accessibility

Preserve the Figma's typography, colors, spacing, hierarchy, images, proportions and composition. Adapt the shadcn/ui components to the project's visual identity.

All screens must work on desktop, tablet and mobile, with attention to filters, navigation, forms, cart and checkout. Evaluate, at a minimum, widths of 390, 768 and 1440 pixels.

Use **skeletons with a shimmer effect** in data-dependent components while loading, including catalog, detail and cart summary. Preserve the content dimensions to avoid layout shifts and respect the reduced-motion preference.

Required:

- keyboard navigation and visible focus;
- focus management in dialogs and drawers;
- proper semantics, labels and error messages associated with fields;
- text alternatives for relevant images;
- legible contrast and states that do not rely on color alone;
- accessible feedback for mutations and real-time changes;
- no unwanted horizontal overflow and no content loss when zoomed.

Use the file's assets when available and keep the required images and fonts accessible for local execution. Document any asset substitution or accessibility adjustment relative to the layout.

## 9. Tests with Playwright

Deliver executable E2E tests running against the mocks, covering:

1. Search, combined filters, sorting, pagination and restoration through history.
2. Direct access to the detail page and handling of a non-existent resource.
3. Sign up, login, session expiration, logout and user switching.
4. Favorites, including mutation failure and state recovery.
5. Cart, quantities, removal, coupon and persistence after refresh/login.
6. Full purchase, from the catalog to the confirmed receipt.
7. Payment failure, repeated click and timeout with recovery of the same order.
8. Editing profile, avatar, password and wallets, with validation errors.
9. Price/availability change via Socket.IO during checkout.
10. Duplicate or old events, disconnection and resumption of a pending order.
11. Keyboard navigation, dialog focus and form validation.
12. Skeletons during slow loading, failure feedback and recovery after retry.

Run the main flows in Chromium, in desktop and mobile viewports. Include visual regression for home, detail, cart and payment, with versioned baselines and stable data.

Each test must start from an isolated state. Control the clock, latency and event triggering in time-sensitive scenarios. Deliver an HTML report and traces for failures.

Assertions must observe the interface and the results of the operations. Real-time tests must go through the Socket.IO client and REST tests through the MSW handlers.

## 10. Performance and Lighthouse

Audit home and NFT detail with Lighthouse in mobile and desktop profiles, using an optimized build and the default mock scenario.

| Category | Target |
| --- | ---: |
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |

Run three measurements per page and profile and report the median for each category. Version the audit configuration and deliver HTML/JSON reports, tool versions, environment and execution conditions.

Record LCP, CLS and TBT. Justify results below the targets and identify the causes. The audit must load the deliverable's images, fonts and features, with no simplifications made only to improve the score.
