# Project Review

Static review of the current codebase with a quick build verification.

What I verified:
- `npm run build` succeeds for the frontend.
- The backend was reviewed statically; I did not run the MySQL-backed server in this pass.

## Critical Findings

### 1. The so-called admin endpoints are completely public
Evidence: `server/src/index.js:944-985`

`/api/admin/restaurants` and `/api/admin/restaurants/:restaurantId/menu-template` have no `requireOwner` middleware and no admin check at all. This means any unauthenticated caller can enumerate restaurants and pull menu templates. That is not "admin"; that is data exposure with a misleading route name.

Recommendation: require authentication plus an explicit `requireAdmin` guard, or remove these endpoints if they are only internal scaffolding.

### 2. The OTP flow is not production-ready and is trivial to abuse
Evidence: `server/src/index.js:240-245`, `server/src/index.js:315-390`, `server/src/index.js:471-490`, `server/src/index.js:184-236`, `package.json:6-26`

The server generates OTPs and can echo them back in the response when `EXPOSE_DEV_OTP` is enabled. I also found no SMS, email, or messaging provider anywhere in the repo, which strongly implies production users have no delivery channel for those OTPs. On top of that, the request endpoints have no rate limiting at all; only verification attempts are capped.

Recommendation: wire in a real transport, rate-limit OTP creation by phone/IP, and make dev OTP echoing impossible outside explicit local development.

### 3. Menu deletion conflicts with the schema and will fail once an item has order history
Evidence: `server/src/index.js:719-741`, `server/src/schema.js:128-137`

The UI exposes a plain "Delete" action for every menu item, but the schema uses `ON DELETE RESTRICT` on `order_items.menu_item_id`. The first historical order attached to a menu item turns that delete into a database error. The route does not translate that case into a domain error, so the user gets a server failure instead of a usable explanation.

Recommendation: use soft delete/archive status for menu items, or handle the foreign-key failure and block deletion cleanly in the UI.

### 4. Order status transitions are not enforced on the server
Evidence: `server/src/index.js:893-916`

The API accepts any status in the allowed set and blindly updates the row. There is no current-state check, no transition policy, and no protection against moving a completed order back to pending if someone calls the endpoint directly. The frontend limits actions, but the backend is the source of truth and currently has none.

Recommendation: fetch the current status and enforce a transition map server-side.

## High Findings

### 5. Server-side price validation is incomplete
Evidence: `server/src/index.js:660-693`

The menu creation route only checks `Number.isNaN(priceValue)`. Negative prices, absurdly large prices, and other nonsensical values still pass. That pollutes revenue reporting and order totals.

Recommendation: enforce `price >= 0`, a sensible upper bound, and preferably a decimal precision rule before insert.

### 6. Upload validation trusts the filename extension instead of the file content
Evidence: `server/src/index.js:58-75`

The multer config decides whether a file is an "image" purely from `file.originalname`. There is no `fileFilter`, MIME validation, or content sniffing. Renaming arbitrary content to `.png` is enough to get it stored under a public uploads path.

Recommendation: add a `fileFilter`, validate MIME type, and verify the file can actually be decoded as an image before persisting it.

### 7. The backend is a 1005-line god file
Evidence: `server/src/index.js` is 1005 lines; route handling begins around `server/src/index.js:303`

Auth, OTP issuance, cookies, uploads, menu logic, table logic, order logic, reports, public routes, admin routes, static file serving, and error handling all live in one file. This is a direct SRP violation and exactly how bugs hide in plain sight.

Recommendation: split the file into routers, services, validators, and middleware with isolated responsibilities.

### 8. Key frontend components are also violating SRP
Evidence: `src/components/WorkspaceShell.jsx:1-245`, `src/pages/PublicOrderPage.jsx:37-466`

`WorkspaceShell` is supposed to be layout, but it also fetches permissions, handles logout, owns restaurant creation, uploads images, and manages flash rendering. `PublicOrderPage` is a large state machine, nested tree renderer, and full page layout in one component. Both files are doing too much, which makes them hard to change safely.

Recommendation: extract hooks for data and state transitions, and split rendering into smaller presentational components.

### 9. The app does redundant fetching and returns bloated payloads
Evidence: `src/pages/RestaurantLayout.jsx:16-23`, `server/src/index.js:620-633`, `server/src/index.js:754-775`, `server/src/index.js:874-886`, `server/src/index.js:926-938`, `server/src/repository.js:205-220`

`RestaurantLayout` already fetches the restaurant and workspace summary. Then the child endpoints fetch the same summary again, and several of those endpoints return `restaurant` and `workspaceSummary` even though the page only uses `items`, `tables`, `orders`, or `reports`. That is wasted query load and sloppy API design.

Recommendation: separate page-shell data from resource data, and stop returning fields the client does not consume.

### 10. The project has no automated test or lint safety net
Evidence: `package.json:17-26`

There is no `test`, `lint`, or type-check script. I also found no test suite files in the repo. This is a UI-heavy, stateful, auth-carrying application with effectively zero automated regression protection.

Recommendation: add at minimum unit coverage for utilities/services and a few end-to-end happy-path checks for auth, menu creation, table QR flow, and public ordering.

## Medium Findings

### 11. The image-position UI lies about what it saves
Evidence: `src/pages/MenuPage.jsx:50-63`, `src/pages/RegisterPage.jsx:41-53`, `src/components/WorkspaceShell.jsx:86-99`

The user can drag the focal point and the crop helper uses that value, but the submitted `imagePositionX/Y` fields are hard-coded to `"50"` in all three flows. That means the persisted focal-point metadata never matches the user's actual selection.

Recommendation: send the real selected values, or delete the stored position fields entirely if the crop is the true source of truth.

### 12. The stylesheet contains duplicated and obsolete design systems
Evidence: `src/template-workspace.css:1`, `src/template-workspace.css:406`, `src/template-workspace.css:1263`, `src/template-workspace.css:1789`, `src/pages/PublicOrderPage.jsx:5`

`template-workspace.css` contains an old root theme, customer-page styles, another customer-page block later, and then a second root/theme system for the current workspace. Meanwhile the public ordering page imports `template-order.css` separately. This is dead weight and guarantees style drift.

Recommendation: delete unused customer styling from `template-workspace.css` and keep one stylesheet per actual surface.

### 13. Documentation and configuration are out of sync with reality
Evidence: `README.md:8`, `README.md:15`, `README.md:45-50`, `README.md:63-66`, `.env:1-3`, `server/src/index.js:613-719`, `package.json:9`, `server/src/config.js:35`

The README claims `.env.example` exists, but it does not. It claims "Menu CRUD", but the server exposes create, read, and delete only. It mentions "Session auth", yet the app ships a custom token-cookie system while `express-session` and `sessionSecret` sit unused. It also says `PUBLIC_APP_URL` should point at the frontend, while the checked-in local `.env` points it at the backend.

Recommendation: update the docs to describe the actual system, remove dead dependencies/config, and stop documenting features that do not exist.

## UI/UX And Visual Findings

### 14. Currency and locale handling are inconsistent and misleading
Evidence: `src/lib/format.js:1-30`, `src/pages/PublicOrderPage.jsx:168-170`, `src/pages/PublicOrderPage.jsx:495-497`, `src/pages/OrdersPage.jsx:107-111`, `src/pages/ReportsPage.jsx:47-55`

The codebase hard-codes USD formatting and raw decimal output, while the product copy and phone placeholders point at a Kenyan market. The app also mixes formatted and unformatted values instead of using one formatting layer consistently.

Recommendation: pick a real locale/currency strategy and use shared formatters everywhere.

### 15. The orders view prints raw timestamps straight from the database
Evidence: `src/pages/OrdersPage.jsx:106-111`

`order.createdAt` is dumped directly into the table with no localization and no readable formatting. That is a classic "developer data leaked into the UI" problem.

Recommendation: format date/time values in the user's locale before rendering.

### 16. The category strip on the public menu behaves like a filter, not navigation
Evidence: `src/pages/PublicOrderPage.jsx:340-346`, `src/pages/PublicOrderPage.jsx:426-436`

Clicking a category button does not scroll to that section; it hides every other root section instead. The visual pattern says "jump to section", the behavior says "replace the entire menu with a single tab". That mismatch is confusing and makes orientation worse when users expect browsing, not mode-switching.

Recommendation: either make the buttons real in-page navigation or restyle/relabel them explicitly as tabs.

### 17. The public order page has hover affordances but no keyboard focus affordances
Evidence: `src/template-order.css:157-168`, `src/template-order.css:220-239`, `src/template-order.css:265-312`

Buttons and toggles get hover styling, but the stylesheet has no `:focus` or `:focus-visible` rules for the interactive controls. Keyboard users get almost no visible indication of where they are.

Recommendation: add clear focus-visible states for search, category buttons, section toggles, quantity buttons, and the order button.

### 18. The table lookup field is unlabeled
Evidence: `src/pages/PublicOrderPage.jsx:444-449`

The manual table reference form relies on placeholder text only. That is weak accessibility and poor usability once the placeholder disappears.

Recommendation: add a real `<label>` or `aria-label`.

### 19. The workspace overuses tiny uppercase mono text
Evidence: `src/template-workspace.css:2027-2039`, `src/template-workspace.css:2078-2093`, `src/template-workspace.css:2271-2288`, `src/template-workspace.css:2524-2528`

Navigation, labels, headers, and metadata are frequently rendered at 10-11px in uppercase mono. It looks styled, but it reads like a design comp that never had to survive fatigue, mobile glare, or actual kitchen operations.

Recommendation: increase the base utility text size, reduce all-caps usage, and reserve mono text for data where it actually helps.

### 20. Error feedback disappears too quickly
Evidence: `src/components/FlashStack.jsx:4-16`

All flash messages auto-dismiss after 4.2 seconds, including errors. That is too aggressive for operational workflows and too brittle for accessibility.

Recommendation: keep success toasts transient if you want, but make errors persistent until dismissed.

## Bottom Line

The project is visually ambitious and the build currently succeeds, but the implementation is not disciplined enough yet. The biggest problems are not cosmetic:

- security boundaries are weak,
- auth is half-finished,
- destructive flows conflict with the database model,
- the architecture is overly centralized,
- and several UI decisions trade clarity for styling.

This needs another engineering pass before it deserves to be called production-ready.
