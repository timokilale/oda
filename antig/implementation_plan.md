# Implementation Plan — Fix All UI/UX Review Findings

> Every finding from [UI_UX_BRUTAL_REVIEW.md](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/UI_UX_BRUTAL_REVIEW_antigravity.md) is addressed below, grouped into 6 phases of execution. Each phase builds on the previous one.

---

## User Review Required

> [!IMPORTANT]
> **Scope decisions on 4 items that affect the database schema:**
> - **OWN-L09 (Currency):** Adding a `currency` column (VARCHAR 3, default `KES`) to the `restaurants` table. `formatCurrency` will become restaurant-aware. Acceptable?
> - **OWN-L10 (Sort order):** Adding a `sort_order` INT column to `menu_items`. No drag-and-drop UI — instead, move-up / move-down buttons. Acceptable?
> - **OWN-L12 (Date filtering):** Adding `?period=today|week|month|all` query param to the reports endpoint. No calendar date-picker — just preset periods. Acceptable?
> - **CUS-L01 (Order tracking):** Lightweight polling (every 15s) on the public page after order placement, showing status changes. No WebSocket. Acceptable?

> [!WARNING]
> **Two findings are intentionally scoped down** to avoid feature creep:
> - **OWN-L07 (Account settings):** Will add an account info panel showing phone number and session info with a logout button. Phone number change and ownership transfer require a full OTP re-verification flow and are out of scope.
> - **CUS-L03 (Order modify/cancel):** Will add customer-side cancel for `pending` orders only (within a short window). Full order modification is a new product feature, not a bug fix.

---

## Phase 1: Critical Bugs & Safety Fixes
*Files touched: 6 · No visual changes · Ship-blocking issues*

### Fixes OWN-L06 · React Rules of Hooks violation

#### [MODIFY] [LoginPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/LoginPage.jsx)
- Move the `if (owner) { return <Navigate /> }` block **below** all hook calls. The early return currently sits between `useState` and `useEffect`, breaking the Rules of Hooks.

#### [MODIFY] [RegisterPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RegisterPage.jsx)
- Same fix: move the `if (owner)` guard below all `useState`/`useEffect` calls.

---

### Fixes OWN-L05 · Inactive restaurant enforcement

#### [MODIFY] [publicRoutes.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/routes/publicRoutes.js)
- In the `GET /order-context` handler (line 14): after fetching the restaurant, check `if (!restaurant.active)` and throw `HttpError(403, "This restaurant is not currently accepting orders.")`.
- In the `POST /orders` handler (line 46): same check after fetching restaurant.

---

### Fixes OWN-U02 · Dev OTP shown in production

#### [MODIFY] [LoginPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/LoginPage.jsx)
- Wrap the devOtpCode display in `import.meta.env.DEV` check: `{import.meta.env.DEV && devOtpCode ? (...) : null}`.

#### [MODIFY] [RegisterPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RegisterPage.jsx)
- Same `import.meta.env.DEV` guard.

---

### Fixes CUS-L02 · No rate limiting on public orders

#### [MODIFY] [publicRoutes.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/routes/publicRoutes.js)
- Add a simple in-memory rate limiter (Map of `ip → { count, windowStart }`). Limit to 10 orders per IP per 5-minute window. Return `HttpError(429, "Too many orders. Please wait before trying again.")`.

---

### Fixes A11Y-05 · Raw CSS injection via `<style>` tag

#### [MODIFY] [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- Replace `import orderCss from "../template-order.css?raw"` with a normal CSS import `import "../template-order.css"`.
- Remove the `<style>{orderCss}</style>` element.
- Add scoping: wrap all order CSS rules under a `.order-page` parent selector, and add `className="order-page"` to the root `<div className="shell">`.

#### [MODIFY] [template-order.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css)
- Scope all rules under `.order-page` to prevent leaking into workspace pages.

---

## Phase 2: Design System Foundation
*Files touched: 2 CSS files · Establishes tokens used by all subsequent phases*

### Fixes TYP-01, TYP-02, TYP-03, TYP-04, OWN-V01, OWN-V02, OWN-V05, OWN-V08, A11Y-02

#### [MODIFY] [template-workspace.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css)

**Design tokens (add to `:root`):**
```css
/* Typography */
--font-body: 'DM Sans', system-ui, sans-serif;   /* replaces mono for body */
--font-mono: 'DM Mono', ui-monospace, monospace;  /* kept for prices/data */
--font-display: 'Cormorant Garamond', Georgia, serif;

--lh-tight: 1.1;
--lh-normal: 1.5;
--lh-relaxed: 1.7;

--ls-tight: 0.01em;
--ls-normal: 0.02em;
--ls-wide: 0.06em;
--ls-caps: 0.08em;

/* Border radius */
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-pill: 999px;

/* Status colors */
--status-pending: #c48a2a;
--status-pending-bg: rgba(196, 138, 42, 0.12);
--status-confirmed: #3a8a5c;
--status-confirmed-bg: rgba(58, 138, 92, 0.12);
--status-completed: #5a7a9a;
--status-completed-bg: rgba(90, 122, 154, 0.12);
--status-cancelled: #9b5a4a;
--status-cancelled-bg: rgba(155, 90, 74, 0.12);
--status-active: #3a8a5c;
--status-active-bg: rgba(58, 138, 92, 0.12);
--status-inactive: #9b5a4a;
--status-inactive-bg: rgba(155, 90, 74, 0.12);
```

**Body font change (OWN-V01):**
- Change `.workspace-page` from `font-family: var(--font-mono)` to `font-family: var(--font-body)`.
- Keep `var(--font-mono)` only on: `.mono-total`, price columns, OTP inputs, table references.

**Button hierarchy (OWN-V02):**
- Add `.button-ghost` variant: `background: none; border: none; color: var(--muted); text-decoration: underline;`
- Add `.button-secondary` variant: lighter background, more subtle than default.
- Differentiate default buttons with slightly more visual weight.

**Status pill variants (OWN-V05):**
- Add `.status-pill--pending`, `--confirmed`, `--completed`, `--cancelled`, `--active`, `--inactive` with distinct background/text colors from the new status tokens.

**Empty state fix (OWN-V08):**
- Change `border: 1px dashed var(--line2)` to `border: 1px solid var(--line)` on `.empty-state`.
- Add a subtle background pattern or icon placeholder.

**Contrast fix (A11Y-02):**
- Darken `--muted` from `#766a57` to `#5e5443` (~4.8:1 contrast ratio on the light bg).
- Apply same fix to evening and night themes.

**Line-height consolidation (TYP-01):**
- Replace all arbitrary values with the three tokens.

**Italic discipline (TYP-02):**
- Remove `font-style: italic` from `.metric-value` and `.panel-title`. Keep italic only on `.page-title`, `.brand`, and the customer-facing display headings.

**Radius & letter-spacing consolidation (TYP-03, TYP-04):**
- Replace all hardcoded values with the tokens above.

#### [MODIFY] [index.html](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/index.html)
- Add `DM Sans` to the Google Fonts URL (it's the proportional sibling of DM Mono).
- Trim Cormorant Garamond to only 3 weights instead of 8: `300;400;600` (normal + italic for 400 only).

#### [MODIFY] [template-order.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css)
- Apply the same token consolidation for radius, letter-spacing, and line-height.

---

## Phase 3: Shared Component Infrastructure
*Files touched: ~10 · Reusable components for all pages*

### Fixes OWN-V03 · Loading skeletons

#### [NEW] [LoadingSkeleton.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/LoadingSkeleton.jsx)
- Create a `<LoadingSkeleton variant="card|table-row|metric" count={n} />` component.
- Uses CSS `@keyframes shimmer` animation on a gradient background.
- Add `.skeleton`, `.skeleton-card`, `.skeleton-row`, `.skeleton-metric` to workspace CSS.

Replace all "Loading…" text with `<LoadingSkeleton>` in: `DashboardPage`, `MenuPage`, `OrdersPage`, `ReportsPage`, `TablesPage`, `RestaurantLayout`.

---

### Fixes OWN-V04 · Flash message animations

#### [MODIFY] [FlashStack.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/FlashStack.jsx)
- Add entry animation: slide-in from top (workspace) or bottom (order page).
- Add exit animation: fade-out before removing from DOM. Use a `dismissing` state with a ~200ms timeout before calling `onDismiss`.

#### [MODIFY] [template-workspace.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css)
- Add `@keyframes flashIn` and `.flash.is-dismissing` styles.

---

### Fixes OWN-L03, OWN-L01, OWN-U07 · Replace all `window.confirm()` with a custom modal

#### [NEW] [ConfirmDialog.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/ConfirmDialog.jsx)
- Props: `open`, `title`, `message`, `confirmLabel`, `cancelLabel`, `variant` (confirm|danger), `onConfirm`, `onCancel`.
- Traps focus, dismisses on Escape, has backdrop click-to-close.
- CSS in workspace stylesheet.

Replace all `window.confirm()` calls in: `OrdersPage` (OWN-L03), `MenuPage` (OWN-L01), `TablesPage` (OWN-U08), `WorkspaceShell` (OWN-U07 — logout).

---

### Fixes IA-02 · Dynamic page titles

#### [NEW] [usePageTitle.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/hooks/usePageTitle.js)
- `usePageTitle("Orders — Sushi Palace — ODA")` sets `document.title` on mount.
- Add calls in every page component.

---

### Fixes A11Y-01 · Skip-to-content link

#### [MODIFY] [WorkspaceShell.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/WorkspaceShell.jsx)
- Add `<a href="#main-content" className="sr-only sr-only-focusable">Skip to content</a>` as first child.
- Add `id="main-content"` to the content region.
- Add `.sr-only-focusable:focus` CSS that makes it visible.

#### [MODIFY] [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- Add skip link and `id="main"` (already exists).

---

### Fixes A11Y-04 · Fix ARIA tablist pattern

#### [NEW] [SegmentedControl.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/SegmentedControl.jsx)
- Encapsulates the filter buttons with correct ARIA: `role="radiogroup"` on container, `role="radio"` + `aria-checked` on each button. (Using radiogroup instead of tablist since these don't switch tab panels.)
- Keyboard navigation: arrow keys cycle through options.

Replace inline segmented controls in `OrdersPage` and `MenuPage`.

---

### Fixes A11Y-03 · Status pill semantic role

#### [MODIFY] [OrdersPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/OrdersPage.jsx)
- Add `role="status"` and `aria-label={`Order status: ${order.status}`}` to status pill spans.

#### [MODIFY] [DashboardPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/DashboardPage.jsx)
- Same treatment for restaurant active/inactive pill.

---

### Fixes IA-04 · 404 page

#### [NEW] [NotFoundPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/NotFoundPage.jsx)
- Simple branded 404 page with "Page not found" message and a link to dashboard/home.

#### [MODIFY] [App.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/App.jsx)
- Replace `<Navigate to="/" replace />` on catch-all route with `<NotFoundPage />`.

---

### Fixes IA-03 · Duplicate public order URL

#### [MODIFY] [App.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/App.jsx)
- Keep `/order/:restaurantRef` as canonical.
- Change `/r/:restaurantRef/order` to redirect to `/order/:restaurantRef` with query params preserved, instead of rendering `PublicOrderPage` directly.

---

### Fixes IA-01 · Brand consistency

#### [MODIFY] [index.html](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/index.html)
- Change `<title>` from "ODA Mobile" to "ODA".

#### [MODIFY] [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- Fallback header name from "ODA" stays — it's correct.

---

### Fixes PERF-03 · Redundant restaurant fetches

#### [NEW] [RestaurantsContext.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/context/RestaurantsContext.jsx)
- Lift `ownedRestaurants` list into a shared context (alongside AuthContext).
- Fetch once on login, cache result. Provide `refreshRestaurants()` for create/update operations.
- `WorkspaceShell` reads from this context instead of fetching `/restaurants` on every mount.

---

## Phase 4: Owner Page Fixes
*Files touched: ~14 · All owner-facing page improvements*

---

### Fixes OWN-V06, RES-01 · Topbar restructure

#### [MODIFY] [WorkspaceShell.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/WorkspaceShell.jsx)
- Split topbar into two rows:
  1. **Top row:** Brand | Restaurant picker (always visible, defaults to current) | Account chip (phone + logout)
  2. **Nav row:** Restaurants | Orders | Menu | Tables | Reports | Settings (only when inside a restaurant)
- On mobile (<680px): Top row stays horizontal (brand left, account right). Nav row becomes a horizontally scrollable strip below.
- Restaurant picker always shows (even for 1 restaurant) with the restaurant name as a non-interactive chip when only one exists.

#### [MODIFY] [template-workspace.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css)
- Restructure topbar CSS to match the two-row layout.
- Fix mobile breakpoint to keep the topbar compact.

### Fixes OWN-U03 · Breadcrumb / restaurant name in nav

- The restructured topbar (above) shows the restaurant name in the picker, solving this issue. The nav row no longer needs a separate breadcrumb.

### Fixes RES-02 · Nav scroll indicator

#### [MODIFY] [template-workspace.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css)
- Add a `::after` pseudo-element arrow indicator on the nav-row when it overflows, using the existing mask-image fade plus a small `→` affordance.

---

### Fixes OWN-V07 · QuickCreateRestaurant as proper popover

#### [MODIFY] [QuickCreateRestaurant.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/QuickCreateRestaurant.jsx)
- Replace `<details>/<summary>` with a button + conditional panel.
- Add `useEffect` for:
  - Close on Escape key.
  - Close on outside click (use a `ref` and `mousedown` listener).
  - Trap focus inside the form when open.

---

### Fixes OWN-V09 · Tables page inline style

#### [MODIFY] [TablesPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/TablesPage.jsx)
- Remove `style={{ paddingTop: 28 }}`.
- Use `align-items: end` on the `.toolbar-row` flex container instead.

#### [MODIFY] [template-workspace.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css)
- Add `.toolbar-row { align-items: flex-end; }`.

---

### Fixes OWN-V10 · Reports page metrics differentiation

#### [MODIFY] [ReportsPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/ReportsPage.jsx)
- Add inline SVG icons (small, 16×16) inside each metric card for visual distinction: `$` for revenue, `📦` for orders today, `🎫` for average ticket, `✓` for completion rate.
- Use the status-colored variants for the Status breakdown cards (pending=gold, confirmed=green, completed=blue, cancelled=red).

---

### Fixes OWN-V11 · Menu page layout reversal

#### [MODIFY] [MenuPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx)
- Swap the split-layout: catalog on the left (wider), form on the right (narrower).
- On mobile, catalog comes first, form second — the owner sees their items before the add/edit form.

#### [MODIFY] [template-workspace.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css)
- Change `.split-layout` to `grid-template-columns: minmax(0, 1fr) minmax(320px, 420px)`.

---

### Fixes OWN-L02 · Delete menu items

#### [MODIFY] [MenuPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx)
- Add a "Delete" button on archived items only (active items must be archived first).
- Show a `ConfirmDialog` with message: "This cannot be undone. Items with existing orders cannot be deleted."
- Call `DELETE /restaurants/:id/menu-items/:itemId` (endpoint already exists in `menuRoutes.js`).
- Handle 409/FK constraint error gracefully with a flash message.

---

### Fixes OWN-L04 · Order detail view

#### [MODIFY] [OrdersPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/OrdersPage.jsx)
- Add a "View" button per order row that opens a detail panel/modal.
- The modal shows: order ID, table, timestamp, full line items with name/qty/unit price/subtotal, and order total.

#### [MODIFY] [orderRoutes.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/routes/owner/orderRoutes.js)
- Add `GET /:restaurantId/orders/:orderId` endpoint returning full order with line items joined to `menu_items` for name/price.

---

### Fixes OWN-L08 · City/Country validation hints

#### [MODIFY] [RegisterPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RegisterPage.jsx)
- Add `<p className="field-help">` under the Country field: "e.g. Kenya, Uganda, Tanzania".
- Add `minLength={2}` and `maxLength={60}` attributes.
- Same for City field.

#### [MODIFY] [RestaurantSettingsPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RestaurantSettingsPage.jsx)
- Same hints and constraints.

---

### Fixes OWN-L09 · Currency per restaurant

#### [MODIFY] [schema.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/schema.js)
- Add migration: `ALTER TABLE restaurants ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'KES' AFTER phone`.

#### [MODIFY] [utils.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/utils.js)
- Include `currency` in `formatRestaurant()`.

#### [MODIFY] [RestaurantSettingsPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RestaurantSettingsPage.jsx)
- Add a Currency dropdown (KES, UGX, TZS, USD, EUR — presets).

#### [MODIFY] [format.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/lib/format.js)
- Change `formatCurrency` to accept a `currencyCode` parameter: `formatCurrency(value, currency = "KES")`.
- Create formatters lazily and cache them.

#### [MODIFY] All pages using `formatCurrency`
- Pass `restaurant.currency` or context currency where available.

---

### Fixes OWN-L10 · Menu item sort order

#### [MODIFY] [schema.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/schema.js)
- Add migration: `ALTER TABLE menu_items ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER active`.

#### [MODIFY] [MenuPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx)
- Add "↑ Move up" / "↓ Move down" buttons in the action column of the catalog table.
- Each click swaps `sort_order` with the adjacent item and re-fetches.

#### [MODIFY] Backend menu service
- Order menu items by `sort_order ASC, id ASC` in queries.
- Add a `PATCH /:restaurantId/menu-items/:itemId/sort` endpoint.

---

### Fixes OWN-L11 · Category separator hint

#### [MODIFY] [MenuPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx)
- Add `placeholder="e.g. Drinks or Drinks > Hot Drinks"` on the category input.
- Add `<p className="field-help">Use " > " to create sub-categories visible to customers.</p>`.

---

### Fixes OWN-L12 · Reports date filtering

#### [MODIFY] [reportRoutes.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/routes/owner/reportRoutes.js)
- Accept `?period=today|week|month|all` query parameter.
- Pass to the service which adds `WHERE created_at >= ?` based on period.

#### [MODIFY] [ReportsPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/ReportsPage.jsx)
- Add a `SegmentedControl` at the top: Today | This Week | This Month | All Time.
- Re-fetch reports on period change.

---

### Fixes OWN-L13 · Order table number filter

#### [MODIFY] [OrdersPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/OrdersPage.jsx)
- Add a text input above the orders table: "Filter by table…"
- Client-side filter on `order.tableNumber`.

---

### Fixes OWN-L14 · Order polling

#### [MODIFY] [OrdersPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/OrdersPage.jsx)
- Add `useEffect` with `setInterval(loadOrders, 15000)` for auto-refresh.
- Show a "Last updated: Xs ago" indicator.
- Cleanup interval on unmount.

---

### Fixes OWN-U01 · OTP resend redundancy

#### [MODIFY] [LoginPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/LoginPage.jsx)
- Remove the `<span className="muted-text">` cooldown message. Keep only the button with countdown text.

#### [MODIFY] [RegisterPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RegisterPage.jsx)
- Same fix.

---

### Fixes OWN-U04 · Duplicate "New item" / "Cancel editing" buttons

#### [MODIFY] [MenuPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx)
- Remove the "New item" button from the panel header.
- Keep only the "Cancel editing" button at the form bottom (rename to "Cancel").
- The panel title "Edit menu item" / "Add menu item" is sufficient context.

---

### Fixes OWN-U05 · Image hint text when no image

#### [MODIFY] [ImagePositionField.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/ImagePositionField.jsx)
- Conditionally render the hint text only when `resolvedPreviewUrl` is truthy. When empty, the placeholder text inside the frame is sufficient.

---

### Fixes OWN-U06 · "Restaurant limit reached" message

#### [MODIFY] [WorkspaceShell.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/WorkspaceShell.jsx)
- Replace bare `<span>` with a styled chip: "Limit: 1 restaurant" (or the actual number), with a tooltip or title attribute explaining the restriction.

---

### Fixes OWN-U08 · Table deletion warning improvement

#### [MODIFY] [TablesPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/TablesPage.jsx)
- Replace `window.confirm()` with `ConfirmDialog` having message: "This will permanently delete the QR code for Table X. Any printed copies of this QR code will stop working. Existing orders from this table are not affected."

---

### Fixes OWN-U09 · Settings page filler panel

#### [MODIFY] [RestaurantSettingsPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RestaurantSettingsPage.jsx)
- Replace the "What Changes Here" panel with a useful "Quick Stats" summary: table count, active menu items, open orders — pulled from workspace context. This gives the settings page a purpose beyond the form.

---

### Fixes OWN-L07 · Account info (scoped)

#### [MODIFY] [WorkspaceShell.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/WorkspaceShell.jsx)
- Replace bare phone number text with a clickable account chip that shows a small dropdown: phone number, "Logged in as owner", and the Logout button (with confirmation).

---

## Phase 5: Customer Page Fixes
*Files touched: ~8 · All customer-facing improvements*

---

### Fixes CUS-V01 · Item fallback visual improvement

#### [MODIFY] [template-order.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css)
- For items without images: replace the random HSL block with a consistent, subtle gradient using the restaurant's brand gold tones. Add an SVG utensils/plate icon overlay (CSS-only, no external asset).

#### [MODIFY] [MenuNode.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx)
- Add a `data-has-image` attribute to item cards; CSS uses this to show/hide the fallback icon.

---

### Fixes CUS-V02 · "No description yet." default text

#### [MODIFY] [MenuNode.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx)
- If no description, simply don't render the description paragraph. The expand area shows only the quantity controls.

---

### Fixes CUS-V03 · Duplicate search icon

#### [MODIFY] [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- When `searchOpen` is true, hide the search toggle button (or swap its icon to an "X" close icon).

---

### Fixes CUS-V04 · Cart strip mobile height

#### [MODIFY] [template-order.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css)
- On mobile (<720px), keep cart strip as a single horizontal row: summary text on the left (condensed), button on the right. Remove the column stacking. Reduce padding.

---

### Fixes CUS-V05 · Cart review vs. success dialog visual distinction

#### [MODIFY] [template-order.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css)
- Give `.order-success__dialog` a distinct top-border accent in green/gold, a checkmark icon header, and slightly different background to visually separate it from the cart review sheet.

---

### Fixes CUS-L01 · Order tracking after placement

#### [MODIFY] [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- After order placement, show a persistent "Order Status" bar (replacing the one-time dialog) that polls `GET /public/restaurants/:ref/orders/:id/status` every 15 seconds.
- Show status transitions: Pending → Confirmed → Completed (or Cancelled).

#### [MODIFY] [publicRoutes.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/routes/publicRoutes.js)
- Add `GET /restaurants/:restaurantRef/orders/:orderId/status` — returns `{ status, updatedAt }`. No auth required (order ID is the "secret").

---

### Fixes CUS-L03 · Customer order cancellation (scoped to pending)

#### [MODIFY] [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- While order is `pending`, show a "Cancel Order" button in the status tracker.

#### [MODIFY] [publicRoutes.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/routes/publicRoutes.js)
- Add `PATCH /restaurants/:restaurantRef/orders/:orderId/cancel` — only works if status is `pending`.

---

### Fixes CUS-L04 · Quantity cap warning

#### [MODIFY] [MenuNode.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx)
- Lower the cap from 99 to 20.
- When quantity reaches 20, visually disable the "+" button and show a brief tooltip/flash: "Maximum quantity reached."

#### [MODIFY] [publicRoutes.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/routes/publicRoutes.js)
- Add server-side validation: reject any item with `quantity > 20`.

---

### Fixes CUS-L05 · Table lookup help text

#### [MODIFY] [TableLookupForm.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/TableLookupForm.jsx)
- Change placeholder to "e.g. 1, A1, VIP-3".
- Add help text below: "Check the printed label on your table."

---

### Fixes CUS-L06 · Search button layout stability

#### [MODIFY] [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- Always render the search button in the header's right section, but hide it with `visibility: hidden` (not `display: none`) when `!menuIsReady`. This reserves the space and prevents layout shift.

---

### Fixes CUS-L07 · Error recovery for failed menu loads

#### [MODIFY] [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- Add a "Retry" button to the error card that re-triggers the context load.
- Add helper text: "Check your internet connection and try again."

---

### Fixes CUS-L08 · Cart persistence via sessionStorage

#### [MODIFY] [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- On every `setQuantities` update, persist to `sessionStorage` under a key like `oda-cart-{restaurantRef}-{tableQuery}`.
- On mount, read from `sessionStorage` and initialize quantities.
- Clear on successful order submission.

---

### Fixes CUS-L09 · Place Order requires review

#### [MODIFY] [CartStrip.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/CartStrip.jsx)
- Change behavior: tapping the "Place Order" button first opens the cart review sheet (if not already open) instead of submitting immediately.
- The actual submit button is inside the cart review sheet, labeled "Confirm & Place Order".

---

### Fixes CUS-U01 · Quick-add button on collapsed cards

#### [MODIFY] [MenuNode.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx)
- Add a small "+" floating action button on the bottom-right of the item card visual zone (visible on collapsed state).
- Tapping it increments quantity by 1 without expanding the card.
- `event.stopPropagation()` to prevent the card expand toggle.

#### [MODIFY] [template-order.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css)
- Style `.item-card__quick-add` as a small circular gold button.

---

### Fixes CUS-U02 · Quantity badge on collapsed card

#### [MODIFY] [MenuNode.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx)
- When item has quantity > 0 and card is collapsed, show a quantity badge (small gold circle with number) on the top-right of the card.

#### [MODIFY] [template-order.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css)
- Style `.item-card__qty-badge` as an absolute-positioned circle.

---

### Fixes CUS-U03 · Haptic / visual feedback on quantity change

#### [MODIFY] [MenuNode.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx)
- Add `navigator.vibrate?.(10)` on quantity change (short pulse).
- Add a brief CSS scale pulse animation on the `.qty-val` element when it changes.

---

### Fixes CUS-U04 · Cart strip tap affordance

#### [MODIFY] [CartStrip.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/CartStrip.jsx)
- Add a small upward chevron `^` icon next to the summary text.
- Add `aria-label="Tap to review your order"`.

#### [MODIFY] [template-order.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css)
- Style the chevron with a subtle bounce animation.

---

### Fixes CUS-U05 · Order number prominence on success dialog

#### [MODIFY] [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- Display order number in a large, bold, standalone element: `<div className="order-success__number">#42</div>`.
- Add copy-to-clipboard functionality.

---

### Fixes A11Y-06 · Escape key for order success dialog

#### [MODIFY] [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- Add `useEffect` that listens for `keydown` event on Escape to close the `orderResult` dialog.
- Same for the cart review backdrop.

---

## Phase 6: Performance & Responsive Polish
*Files touched: ~4 · Final pass*

---

### Fixes PERF-01 · Font loading optimization

#### [MODIFY] [index.html](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/index.html)
- Add `<link rel="preload" as="style">` for the Google Fonts CSS.
- Use `font-display: optional` for Cormorant Garamond (decorative) and `font-display: swap` for DM Sans/Mono (functional).
- Trim unused weights from the URL as described in Phase 2.

---

### Fixes RES-03 · Table-to-card transition smoothing

#### [MODIFY] [template-workspace.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css)
- Lower the responsive breakpoint from 680px to 600px (most tablets are above this, reducing mid-range jumps).
- Add `transition: all 200ms ease` on table rows as a visual cushion (won't animated the layout change, but smooths property transitions).

---

### Fixes RES-04 · Customer menu max-width on wide screens

#### [MODIFY] [template-order.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css)
- Add `.main-content { max-width: 960px; margin: 0 auto; }` to constrain the menu content area on wide monitors.

---

## Open Questions

> [!IMPORTANT]
> 1. **New font (DM Sans):** This adds a third Google Font. The weight budget goes from ~10 files to ~12 but the total download is similar because we trim Cormorant Garamond weights. Is this acceptable, or should we use a system font stack for body text?
> 2. **Order polling interval:** 15 seconds was chosen as a balance between freshness and server load. Would you prefer a different interval?
> 3. **Menu item delete:** The plan allows deletion only of archived items with no orders. Should we also allow force-delete (with cascade) for admin users?

---

## Verification Plan

### Automated Tests
- Run `npm run test` after each phase to verify no regressions.
- Add new test cases for:
  - Public order rate limiting (server test)
  - Inactive restaurant rejection (server test)
  - Currency formatting with different codes (frontend test)
  - Cart sessionStorage persistence (frontend test)

### Manual Verification
- Start the dev server (`npm run dev` + `npm run server`) after each phase.
- Walk through every Owner flow: register → create restaurant → add menu items → create tables → view orders → check reports → edit settings → logout.
- Walk through every Customer flow: scan QR → browse menu → search → add items → review cart → place order → track status → cancel order.
- Test at 375px, 768px, 1024px, and 1920px widths.
- Verify keyboard navigation through all pages.
- Check color contrast with browser dev tools.
