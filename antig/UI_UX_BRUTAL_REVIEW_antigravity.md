# ODA Mobile — Brutal UI/UX Review

> **Reviewer posture:** 50 years of HCI, pragmatics, hedonics, and deep contempt for sloppy work. Every flow was walked through by reading every JSX component, CSS file, route handler, and database schema. Two personas were assumed: an **Owner** doing everything the system allows, and a **Customer** doing everything the system allows. No mercy.

---

## Table of Contents

1. [Verdict Summary](#verdict-summary)
2. [Owner Side — Visual Flaws](#owner-side--visual-flaws)
3. [Owner Side — Logical / Functional Flaws](#owner-side--logical--functional-flaws)
4. [Owner Side — UX / Interaction Flaws](#owner-side--ux--interaction-flaws)
5. [Customer Side — Visual Flaws](#customer-side--visual-flaws)
6. [Customer Side — Logical / Functional Flaws](#customer-side--logical--functional-flaws)
7. [Customer Side — UX / Interaction Flaws](#customer-side--ux--interaction-flaws)
8. [Cross-Cutting: Accessibility Failures](#cross-cutting-accessibility-failures)
9. [Cross-Cutting: Information Architecture](#cross-cutting-information-architecture)
10. [Cross-Cutting: Responsive & Mobile Breakage](#cross-cutting-responsive--mobile-breakage)
11. [Cross-Cutting: Performance & Perceived Speed](#cross-cutting-performance--perceived-speed)
12. [Typography & Design System Crimes](#typography--design-system-crimes)
13. [Final Scorecard](#final-scorecard)

---

## Verdict Summary

> [!CAUTION]
> This application has the visual sensibility of a first-draft wireframe that someone accidentally shipped. The owner dashboard is a functional skeleton dressed in a monospace font, and the customer ordering experience—while more polished—is riddled with dead ends, missing feedback, and puzzling interactions. The project confuses "minimalism" with "not finishing the work."

---

## Owner Side — Visual Flaws

### OWN-V01 · The entire owner UI is typeset in a monospace font
- **File:** [template-workspace.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css#L181-L183)
- `font-family: var(--font-mono)` applied to the body. Monospace fonts are for code editors, not restaurant management dashboards. Every label, every paragraph, every bit of help text wears the same typewriter costume. This tanks readability for anything longer than two words. The serif display font is only used for headings — the vast majority of text the owner reads is a mono slab.

### OWN-V02 · Button visual hierarchy is flat
- **File:** [template-workspace.css](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css#L605-L620)
- `.button` (default), `.button-confirm` (gold), and `.button-danger` (red-brown) are the only three variants. All three have 12px uppercase monospace labels. The default button uses `var(--surface)` with a barely-visible border. Placed side-by-side (e.g., "Edit" + "Archive" in the menu catalog), the visual weight is nearly identical and the user has to **read every word** to figure out which action is primary and which is secondary. There is no ghost/link button variant.

### OWN-V03 · No loading skeletons or spinners — just text
- **Files:** [DashboardPage.jsx L50-54](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/DashboardPage.jsx#L50-L54), [MenuPage.jsx L397-400](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx#L397-L400), [OrdersPage.jsx L137-140](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/OrdersPage.jsx#L137-L140)
- Every single loading state is "Loading restaurants…", "Loading menu catalog…", "Loading order queue…". No skeleton, no shimmer, no spinner, no progress bar. It looks like a terminal from 1978. In HCI literature this is called "blank staring" — the system gives zero sense of progress.

### OWN-V04 · Flash messages have no animation
- **File:** [FlashStack.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/FlashStack.jsx)
- The flash appears and disappears with no entry or exit animation. The CSS class `.is-dismissing` exists in the order CSS but is never applied by the component. Success or error messages just pop into existence and hard-cut away.

### OWN-V05 · Status pills all look the same color for active states
- **File:** [template-workspace.css L549-560](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css#L549-L560)
- `.status-pill` uses `--workspace-chip-bg` and `--workspace-chip-text` for everything. "Active" on the restaurant card, "Pending" on orders, "Confirmed" on orders — they all get the same gold-ish chip. There is zero color differentiation between order statuses. "Cancelled" orders look exactly the same as "Pending" ones.

### OWN-V06 · The topbar is not a cohesive navigation bar — it is a dump of elements
- **File:** [WorkspaceShell.jsx L90-186](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/WorkspaceShell.jsx#L90-L186)
- The topbar contains: brand link, nav chips, restaurant picker dropdown, "New restaurant" details disclosure, phone number, logout button. All in a flex-wrap row. On desktop it stretches across the page with random gaps. The brand sits on the left, the phone number and logout are bunched on the right with no visual grouping. The restaurant picker dropdown only appears when the owner has >1 restaurants, meaning the layout structurally changes based on data.

### OWN-V07 · QuickCreateRestaurant is a `<details>` element used as a dropdown
- **File:** [QuickCreateRestaurant.jsx L65-161](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/QuickCreateRestaurant.jsx#L65-L161)
- This positions a form absolutely below a `<summary>` styled as a button. It does not trap focus, does not dismiss on outside click (it's native `<details>` toggle only), and does not behave like a modal or popover. Pressing Escape doesn't close it. Scroll the page and it stays pinned to the topbar. This is a half-baked UI pattern.

### OWN-V08 · Empty states are styled with dashed borders
- **File:** [template-workspace.css L706-711](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css#L706-L711)
- `border: 1px dashed var(--line2)` — dashed borders scream "under construction." This is not a deliberate visual idiom; it just looks unfinished. Every empty state (no restaurants, no orders matching filter, no menu items) gets the same sad dashed box.

### OWN-V09 · Tables page has a hardcoded `style={{ paddingTop: 28 }}` inline
- **File:** [TablesPage.jsx L138](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/TablesPage.jsx#L138)
- Inline style used to vertically align the "Create QR" button with the label+input. This is a layout hack, not a design system. It will break if the label font size, gap, or field height changes.

### OWN-V10 · Reports page is a wall of metric cards with no visual differentiation
- **File:** [ReportsPage.jsx L45-62](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/ReportsPage.jsx#L45-L62)
- Revenue, Orders Today, Average Ticket, Completion — four identical gold-glow boxes. Zero iconography, zero charts, zero trending indicators. Then a second grid of four identical boxes for status breakdown. Then a small table. This is a spreadsheet, not a report. The owner gets no sense of whether the business is going up or down.

### OWN-V11 · Menu page split-layout puts the form on the left, catalog on the right
- **File:** [MenuPage.jsx L214](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx#L214)
- The form column is `minmax(320px, 420px)` and the catalog gets `minmax(0, 1fr)`. This means the owner's primary workspace (the item list they scan repeatedly) is crammed into whatever space remains after the form. On ≤920px it collapses to single column, putting the form above the catalog — meaning the owner has to scroll past the entire form every single time to see their existing items.

---

## Owner Side — Logical / Functional Flaws

### OWN-L01 · No confirmation, undo, or optimistic update for archiving menu items
- **File:** [MenuPage.jsx L149-173](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx#L149-L173)
- Clicking "Archive" on a menu item fires `toggleItemAvailability` immediately with zero confirmation dialog. `window.confirm()` is used for order status changes but not here. Archiving is silent and instant. The owner sees a success flash after the network round-trip, but if they misclicked, there is no undo — they have to switch to the "Archived" filter tab and click "Restore."

### OWN-L02 · No way to permanently delete a menu item
- **Files:** [MenuPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx), [menuRoutes.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/routes/owner/menuRoutes.js)
- The page subtitle says "fix mistakes without destructive workarounds" but the only action is archive/restore. There is no delete. If an owner accidentally creates a test item named "asdfasdf," it lives in the archived catalog forever. The schema has `ON DELETE RESTRICT` on `order_items → menu_items`, so deletion would fail if the item has any orders — but the UI doesn't even surface this constraint. It just silently offers no delete.

### OWN-L03 · Order status transitions have no guard rails beyond `window.confirm()`
- **File:** [OrdersPage.jsx L33-59](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/OrdersPage.jsx#L33-L59)
- `window.confirm()` is the only protection before completing, confirming, or cancelling an order. A native browser dialog — no branding, no item summary, no visual indication of what they're about to do. If the browser is configured to suppress `confirm()` dialogs, the actions fire immediately.

### OWN-L04 · No way to view individual order details
- **File:** [OrdersPage.jsx L155-217](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/OrdersPage.jsx#L155-L217)
- The order table shows `order.itemsSummary` (a server-computed string), but there is no expand/modal to see the full line items, quantities, and unit prices. If a customer ordered 3 items, the owner sees "Burger × 2, Fries × 1" as a summary string and **nothing else**. No detail view. The owner cannot see what specific price was charged per item.

### OWN-L05 · Restaurant "Inactive" status has no actual enforcement
- **Files:** [RestaurantSettingsPage.jsx L127-142](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RestaurantSettingsPage.jsx#L127-L142), [publicRoutes.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/routes/publicRoutes.js)
- The owner can set a restaurant to "Inactive" in settings, but the public order endpoint (`/public/restaurants/:restaurantRef/order-context`) does **not** check the `active` flag. Customers can still load the menu and place orders to an "Inactive" restaurant. The "Inactive" badge is a lie.

### OWN-L06 · `useEffect` called after conditional return is a React Rules of Hooks violation
- **Files:** [LoginPage.jsx L16-30](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/LoginPage.jsx#L16-L30), [RegisterPage.jsx L27-41](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RegisterPage.jsx#L27-L41)
- Both pages have `if (owner) { return <Navigate ... /> }` before the `useEffect` call. This means hooks are called conditionally, which violates the Rules of Hooks. This can cause runtime errors in React 19 strict mode.

### OWN-L07 · No way for an owner to edit their own phone number or transfer ownership
- **Files:** [AuthContext.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/context/AuthContext.jsx), [WorkspaceShell.jsx L170](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/WorkspaceShell.jsx#L170)
- The phone number is displayed in the topbar as muted text. There is no account settings page, no way to change the number, no way to add a second owner, and no way to delete the account. The owner's identity is frozen at registration.

### OWN-L08 · "City" and "Country" are free-text inputs with no validation
- **File:** [RegisterPage.jsx L164-190](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RegisterPage.jsx#L164-L190)
- An owner can type "xyzzy" into the Country field. There is no dropdown, no autocomplete, no ISO-based validation. Since the app uses `en-KE` locale and KES currency, it is presumably Kenyan — yet the owner can claim to be in "Narnia." This data is displayed on the dashboard card and has no guardrails.

### OWN-L09 · Currency is hardcoded to KES
- **File:** [format.js](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/lib/format.js#L1-L5)
- `new Intl.NumberFormat("en-KE", { currency: "KES" })` — every price in the system is displayed in Kenyan Shillings. The settings page lets the owner set any country, but the currency never changes. If a restaurant is in Uganda, prices still show "KES."

### OWN-L10 · No way to reorder menu items or categories
- **File:** [MenuPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx)
- The `menu_items` table has no `sort_order` column. Items appear in whatever order the database returns them (likely insertion order). There is no drag-and-drop, no "move up / move down," no ordering control. Categories can't be reordered either. The owner has zero control over how their menu appears to customers.

### OWN-L11 · Menu category is a flat text string, but customer menu renders a tree
- **Files:** [MenuPage.jsx L261-278](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx#L261-L278), [utils.js (buildMenuTree)](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/utils.js)
- The owner types a category as a flat string (e.g., "Drinks > Hot Drinks"). The server's `buildMenuTree` splits on " > " to create a hierarchy. But the owner UI gives **zero indication** that " > " is a magic separator for nesting. There's no documentation, no placeholder text, no hint. The owner just sees a plain text field.

### OWN-L12 · Reports are all-time aggregates with no date filtering
- **File:** [ReportsPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/ReportsPage.jsx)
- Revenue, completed orders, average ticket — all computed server-side with no date range parameter. The owner cannot see today's revenue vs. last week's. "Orders today" is the only time-scoped metric. This makes the reports page nearly useless for any business with more than a day of history.

### OWN-L13 · No way to search or filter the order queue by table number
- **File:** [OrdersPage.jsx L62-72](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/OrdersPage.jsx#L62-L72)
- The filter only allows status-based segmentation (Open, Pending, Confirmed, Completed, Cancelled, All). A busy restaurant with 30 tables cannot find orders for a specific table without scrolling through the entire list.

### OWN-L14 · No real-time updates / no polling for the orders page
- **File:** [OrdersPage.jsx L28-31](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/OrdersPage.jsx#L28-L31)
- Orders are loaded once on mount with `loadOrders()` in a `useEffect`. There is no polling, no WebSocket, no Server-Sent Events. If a customer places an order, the owner won't know until they manually refresh the page. For a live kitchen queue, this is a fundamental failure.

---

## Owner Side — UX / Interaction Flaws

### OWN-U01 · OTP resend cooldown shows two redundant pieces of information
- **File:** [LoginPage.jsx L138-174](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/LoginPage.jsx#L138-L174)
- There is a `<span className="muted-text">` saying "Resend available in 28s" AND a disabled button saying "Resend in 28s". Both elements say the same thing. This is visual clutter, not helpful redundancy.

### OWN-U02 · Development OTP is shown in production
- **Files:** [LoginPage.jsx L149-153](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/LoginPage.jsx#L149-L153), [RegisterPage.jsx L245-249](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RegisterPage.jsx#L245-L249)
- `{devOtpCode && <div className="alert">Development OTP: <strong>{devOtpCode}</strong></div>}` — This is displayed whenever the server returns a `devOtpCode`. There is no environment check in the frontend. If the server accidentally returns this field in production, every user sees their OTP on screen. This is a security hazard masquerading as a dev convenience.

### OWN-U03 · No breadcrumb or back navigation from restaurant sub-pages
- **File:** [WorkspaceShell.jsx L99-141](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/WorkspaceShell.jsx#L99-L141)
- The nav bar shows: Restaurants | Orders | Menu | Tables | Reports | Settings. There is no restaurant name visible in the nav. The owner forgets which restaurant they're managing. The restaurant name appears in some page subtitles but not consistently.

### OWN-U04 · The "New item" button in the menu form header is confusing
- **File:** [MenuPage.jsx L223-227](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/MenuPage.jsx#L223-L227)
- When editing an item, the panel title changes to "Edit menu item" and a "New item" button appears in the header. This button resets the form. But it's positioned as a header action, not as a form action; the "Cancel editing" button at the form bottom does the same thing. Two buttons, same function, different locations.

### OWN-U05 · Image position sliders are exposed even when there's no image
- **File:** [ImagePositionField.jsx L162-194](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/ImagePositionField.jsx#L162-L194)
- The sliders only render when `resolvedPreviewUrl` is truthy. But the hint text "Fixed frame. Drag the preview, or fine-tune the sliders below." is always visible, even when there's no image. On an empty state, the user sees instructions for something they can't do yet.

### OWN-U06 · "Restaurant limit reached" is shown as flat text in the header
- **File:** [WorkspaceShell.jsx L167-168](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/WorkspaceShell.jsx#L167-L168)
- `<span className="muted-text">Restaurant limit reached</span>` — This is passive-aggressive and unhelpful. No explanation of what the limit is, no link to contact support, no upgrade path. Just gray text that says you can't do the thing.

### OWN-U07 · No confirmation before logging out
- **File:** [WorkspaceShell.jsx L63-66](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/WorkspaceShell.jsx#L63-L66)
- `handleLogout` fires immediately on click. No "Are you sure?" No unsaved changes warning. If the owner was mid-edit on a menu item form and accidentally hits logout, all work is lost silently.

### OWN-U08 · Table deletion has no indication of consequences
- **File:** [TablesPage.jsx L71-87](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/TablesPage.jsx#L71-L87)
- `window.confirm("Delete this table and its QR code?")` — What about orders already placed from this table? What about printed QR codes already on the physical table? No warning about downstream effects.

### OWN-U09 · Settings page "What Changes Here" panel is filler content
- **File:** [RestaurantSettingsPage.jsx L252-273](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/RestaurantSettingsPage.jsx#L252-L273)
- Two empty-state boxes saying "Owner-side impact" and "Customer-side impact" with generic copy. This is documentation that belongs in a tooltip or help article, not as a permanent panel consuming half the page width. It adds no interactive value.

---

## Customer Side — Visual Flaws

### CUS-V01 · If no image is uploaded for a menu item, the fallback is a solid HSL color block
- **File:** [MenuNode.jsx L114-115](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx#L114-L115)
- `background-color: hsl(var(--item-hue), var(--item-fallback-sat), var(--item-fallback-light))` — The hue is derived from `item.id * 73 + 12 % 360`. This produces random-looking solid colors for items with no photos. A restaurant with no images looks like a pride parade had a nervous breakdown. No icons, no illustrated placeholders, just algorithmically generated background noise.

### CUS-V02 · Item card descriptions use "No description yet." as default
- **File:** [MenuNode.jsx L144](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx#L144)
- If the owner didn't add a description, the customer sees "No description yet." as if the menu is still under construction. This is developer-facing copy leaked into the customer experience. The customer does not care that the owner hasn't finished their homework.

### CUS-V03 · The search bar icon is duplicated in the header
- **File:** [PublicOrderPage.jsx L343-358](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx#L343-L358)
- The magnifying glass SVG is rendered twice (once in the toggle button, once inside the search bar input area). When the search bar is open, the user sees two magnifying glasses. Redundant visual noise.

### CUS-V04 · Cart strip on mobile stacks vertically with full-width button
- **File:** [template-order.css L973-981](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css#L973-L981)
- Below 720px, the cart strip becomes `flex-direction: column` with the "Place Order" button spanning full width. This means the info section (count + total + summary) and the button form are stacked. The fixed bottom bar now takes up approximately 140-160px of screen height. On a 667px iPhone SE, that's about 24% of the viewport eaten by the cart.

### CUS-V05 · No visual distinction between the "review cart" sheet and the "order success" dialog
- **Files:** [template-order.css L849-860](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css#L849-L860)
- Both `cart-review__sheet` and `order-success__dialog` share identical border, radius, gradient, and shadow styles. The user gets the same-looking panel for two fundamentally different interactions (reviewing before buying vs. confirming after buying). No visual differentiation.

---

## Customer Side — Logical / Functional Flaws

### CUS-L01 · No order tracking or status after placing an order
- **File:** [PublicOrderPage.jsx L459-480](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx#L459-L480)
- The order success dialog shows the order ID and says "is now pending," then offers "Back to menu." That's it. There is no way for the customer to track the order status. No polling. No status page. The customer has no idea if the kitchen has confirmed, started, or completed their order. They sit at the table and wonder.

### CUS-L02 · Customer can place unlimited orders with no throttle
- **File:** [publicRoutes.js L44-122](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/server/src/routes/publicRoutes.js#L44-L122)
- The public order endpoint has no rate limiting, no session tracking, no confirmation step beyond the client-side button. A griefer can spam orders from the same table. A child can accidentally submit 50 duplicate orders.

### CUS-L03 · No way to cancel or modify an order after placement
- **File:** [PublicOrderPage.jsx](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx)
- Once the order is placed, the customer has zero control. They can't cancel, can't modify, can't add to an existing order. There's no "order history for this table" view. If the customer made a mistake, their only recourse is yelling at a waiter.

### CUS-L04 · Customer can add up to 99 of a single item
- **File:** [MenuNode.jsx L48-51](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx#L48-L51)
- `Math.max(0, Math.min(99, ...))` — A customer can order 99 burgers with zero warning. No "Are you sure?" for unusual quantities. The server validates that items exist and are active but does not cap quantities.

### CUS-L05 · The "Find your table" manual entry is a confusing dead-end for most users
- **File:** [PublicOrderPage.jsx L382-394](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx#L382-L394)
- If the customer navigates directly to `/order/:restaurantRef` without a `?table=` parameter, they're asked to manually type a "table reference." But what is a "table reference"? Is it "1"? "Table 1"? "VIP-3"? The placeholder says "Enter table reference" — utterly unhelpful. If the customer doesn't know their table's token, they are stuck.

### CUS-L06 · Search only works when the menu is visible — not from the lookup screen
- **File:** [PublicOrderPage.jsx L335-349](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx#L335-L349)
- The search button only renders when `menuIsReady` is true. If the customer is on the table lookup screen or an error screen, search is invisible. This is reasonable, but the search button is also hidden during loading — meaning if the menu takes 5 seconds to load, the customer sees no search icon during that time, then it suddenly appears. Jumpy layout.

### CUS-L07 · No offline fallback or error recovery for failed menu loads
- **File:** [PublicOrderPage.jsx L103-115](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx#L103-L115)
- If the API fails, the customer sees a lookup-card with the error message and a retry form. But the form pre-fills the same table reference that just failed. There's no "check your internet connection" hint, no retry button, no cached fallback. The customer is just shown the error and left to figure it out.

### CUS-L08 · Cart state is lost on page refresh
- **File:** [PublicOrderPage.jsx L24](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx#L24)
- `const [quantities, setQuantities] = useState({})` — Cart is in-memory React state only. No `localStorage`, no `sessionStorage`. If the customer accidentally refreshes, or if the browser suspends the tab on mobile, their entire cart is gone.

### CUS-L09 · The "Place Order" button is in the cart strip but also requires expanding the cart review
- **Files:** [CartStrip.jsx L87-91](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/CartStrip.jsx#L87-L91)
- The "Place Order" button is **always** visible in the cart strip, even without opening the cart review panel. This means a customer can place an order without ever reviewing what's in their cart. The cart review panel is optional — you open it by tapping the info section. Many users will just tap "Place Order" immediately.

---

## Customer Side — UX / Interaction Flaws

### CUS-U01 · Item cards require a tap to expand, then a second interaction to add quantity
- **File:** [MenuNode.jsx L121-140](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx#L121-L140)
- Every menu item requires: (1) tap to expand the card → (2) read the description → (3) tap "+" to add to cart. That's two taps minimum to add a single item. Competing apps like UberEats show "+" directly on the card thumbnail. This interaction model increases friction for every single item added.

### CUS-U02 · Closing an expanded item card does not de-select it visually
- **File:** [MenuNode.jsx L107-112](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx#L107-L112)
- `is-selected` is based on quantity, `is-open` is based on `openItems` set. A customer can add an item, close the card, and come back later. The card shows `is-selected` (gold border) but the expand area is collapsed. There's no visible quantity indicator on the collapsed card. The customer can't tell *how many* they added without re-expanding.

### CUS-U03 · No haptic or audio feedback for "+" / "−" taps on mobile
- **File:** [MenuNode.jsx L147-171](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/MenuNode.jsx#L147-L171)
- The quantity buttons use `onClick` only. No vibration API call, no visual pulse animation. The user taps "+" and the number changes — but on a busy restaurant screen, this is easy to miss.

### CUS-U04 · The cart strip info button does not indicate it's tappable
- **File:** [CartStrip.jsx L73-86](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/public-order/CartStrip.jsx#L73-L86)
- `.cart-strip__info` is a `<button>` styled with `background: none; border: none; padding: 0`. It looks like static text, not a button. There is no arrow, no chevron, no "tap to review" hint. The customer doesn't know they can expand the cart.

### CUS-U05 · The order success dialog has no order number prominence
- **File:** [PublicOrderPage.jsx L459-480](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx#L459-L480)
- The order ID is buried in a sentence: "Order #42 for table 5 is now pending." The customer should see a large, prominent order number (possibly even a QR code) so they can reference it when asking wait staff about their order.

---

## Cross-Cutting: Accessibility Failures

### A11Y-01 · No skip-to-content link
- **File:** [index.html](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/index.html)
- No `<a href="#main" class="sr-only">Skip to content</a>`. Keyboard and screen-reader users must tab through the entire nav on every page load.

### A11Y-02 · Color contrast on muted text is likely failing WCAG AA
- **File:** [template-workspace.css L97](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css#L97)
- `--muted: #766a57` on `--bg: #f5efe3` gives approximately 3.7:1 contrast ratio. WCAG AA requires 4.5:1 for normal text. All `page-subtitle`, `muted-text`, `field-help`, `empty-text`, and `meta-row` elements fail contrast.

### A11Y-03 · Status pills have no semantic role
- **File:** [OrdersPage.jsx L165](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/OrdersPage.jsx#L165)
- `<span className="status-pill">` — no `role`, no `aria-label`. Screen readers just announce the text "Pending" with no context that it's a status indicator.

### A11Y-04 · Segmented controls use `role="tablist"` but buttons don't use `role="tab"`
- **File:** [OrdersPage.jsx L116-134](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/OrdersPage.jsx#L116-L134)
- The container has `role="tablist"` but each button is just `<button type="button" className="button button-segment">`. ARIA tabs pattern requires `role="tab"`, `aria-selected`, and `role="tabpanel"` on the content. This is a broken ARIA pattern — worse than no ARIA at all.

### A11Y-05 · The customer order page injects a raw `<style>` element
- **File:** [PublicOrderPage.jsx L324](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx#L324)
- `<style>{orderCss}</style>` — The entire order CSS is imported as a raw string and injected into the DOM. This works functionally but means the CSS is not scoped and can leak into other routes if routing happens client-side without a full page reload.

### A11Y-06 · The order success backdrop dismiss has no keyboard equivalent
- **File:** [PublicOrderPage.jsx L461](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx#L461)
- `<div className="order-success__backdrop" onClick={() => setOrderResult(null)} aria-hidden="true" />` — The backdrop is clickable to dismiss, but there's no Escape key handler. Keyboard users cannot close this dialog without tabbing to the "Back to menu" button.

---

## Cross-Cutting: Information Architecture

### IA-01 · The app is called "ODA" but the page title says "ODA Mobile"
- **Files:** [index.html L17](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/index.html#L17), [WorkspaceShell.jsx L95](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/WorkspaceShell.jsx#L95)
- The brand says "ODA", the `<title>` says "ODA Mobile", the README says "ODA Mobile." The customer-facing header shows the restaurant name or "ODA." There's no consistent brand identity.

### IA-02 · The page `<title>` never changes
- **File:** [index.html L17](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/index.html#L17)
- Every page is titled "ODA Mobile" in the browser tab. Whether the user is on Login, Dashboard, Menu, Orders, or the public order page — the tab always says "ODA Mobile." This makes it impossible to distinguish tabs and is terrible for browser history.

### IA-03 · Two URL patterns for the same public order page
- **File:** [App.jsx L58-59](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/App.jsx#L58-L59)
- `/order/:restaurantRef` and `/r/:restaurantRef/order` both render `PublicOrderPage`. This is confusing for printed QR codes, documentation, and debugging. Pick one canonical path.

### IA-04 · No 404 page
- **File:** [App.jsx L60](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/App.jsx#L60)
- `<Route path="*" element={<Navigate to="/" replace />}` — All unknown routes silently redirect to home. The user never sees an error if they mistype a URL. They're just teleported. This is disorienting and masks real navigation bugs.

---

## Cross-Cutting: Responsive & Mobile Breakage

### RES-01 · The topbar wraps chaotically on narrow screens
- **File:** [template-workspace.css L989-1017](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css#L989-L1017)
- Below 920px, the topbar stacks vertically. The brand, nav row, restaurant picker, "New restaurant," phone number, and logout ALL stack into a full-width vertical list. On a 375px phone, this could consume 300+ pixels of header space, pushing actual content far below the fold.

### RES-02 · Nav row uses mask-image fade but has no visual scroll indicator
- **File:** [template-workspace.css L244-246](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css#L244-L246)
- The nav row fades to transparent on the right to hint at scrollability. But there's no arrow, no scroll indicator, no overscroll glow. On narrow screens, "Reports" and "Settings" tabs may be completely hidden with no visual cue to the user that they can scroll to find them.

### RES-03 · The responsive table transforms rows into cards at 680px, but the transition is jarring
- **File:** [template-workspace.css L1054-1099](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-workspace.css#L1054-L1099)
- Above 680px: classic table rows. Below 680px: each `<tr>` becomes a card with `data-label` pseudo-elements. There's no intermediate state. At exactly 681px, rows stretch across 100%. At 679px, they become stacked cards. The mental model switch is abrupt. Users at tablet widths around 680px will see the layout jump on rotation.

### RES-04 · Customer menu has no minimum padding on very wide screens
- **File:** [template-order.css L256](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/template-order.css#L256)
- `.main-content { padding: 0; }` — The menu items stretch edge-to-edge with no max-width on the content area. On a 2560px monitor, category sections span the entire width. The item cards' `.item-list` padding is the only constraint, and it's only 12-16px.

---

## Cross-Cutting: Performance & Perceived Speed

### PERF-01 · Two Google Fonts loaded — both render-blocking
- **File:** [index.html L10-15](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/index.html#L10-L15)
- Cormorant Garamond (8 weights) and DM Mono (2 weights) are loaded synchronously. That's 10 font files blocking first paint. `display=swap` is set, but the FOUT (Flash of Unstyled Text) will still be visible.

### PERF-02 · The entire order CSS is loaded as a raw string import and injected as `<style>`
- **File:** [PublicOrderPage.jsx L11](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/pages/PublicOrderPage.jsx#L11)
- `import orderCss from "../template-order.css?raw"` — This means the entire 26KB order CSS is bundled as a JS string, parsed, and injected into the DOM at render time. This does not benefit from browser caching of CSS resources.

### PERF-03 · WorkspaceShell fetches `/restaurants` on every page that uses it
- **File:** [WorkspaceShell.jsx L33-61](file:///c:/Users/MSA%20WIN10%20G/Desktop/odamobile/src/components/WorkspaceShell.jsx#L33-L61)
- Every page wrapped in `WorkspaceShell` triggers `loadOwnedRestaurants()` on mount. Navigate from Orders → Menu → Tables → Reports? That's four redundant `/restaurants` API calls, just to populate the restaurant picker dropdown.

---

## Typography & Design System Crimes

### TYP-01 · Mixed line-height inconsistency
- Page title: `line-height: 0.94` (text overlaps its own line box)
- Body: `line-height: 1.6`
- Metric values: `line-height: 1`
- These aren't intentional typographic choices — they're arbitrary numbers picked per component.

### TYP-02 · The display font is used in italic everywhere — even where italic is semantically wrong
- Headings, panel titles, metric values, restaurant names — all italic Cormorant Garamond. Italic traditionally implies emphasis or a divergence from normal text. When everything is italic, nothing is emphasized. It's decorative laziness.

### TYP-03 · No design token for border-radius — hardcoded values everywhere
- `18px` for surfaces, `16px` for metric cards and empty states, `14px` for quick-create panels, `10px` for field controls and item cards, `8px` for buttons, `4px` for status pills, `3px` for table chips. That's **seven different radius values** with no semantic naming. This is not a design system — it's a pile of magic numbers.

### TYP-04 · letter-spacing values are scattered and inconsistent
- `0.01em`, `0.02em`, `0.03em`, `0.04em`, `0.06em`, `0.08em`, `0.1em`, `0.12em` — Eight distinct letter-spacing values used across the stylesheets. No design tokens, no rationale for when to use which.

---

## Final Scorecard

| Dimension | Score (0–10) | Notes |
|---|---|---|
| **Visual Coherence** | 3/10 | Monospace body + serif display + random radii + no iconography |
| **Interaction Quality** | 3/10 | `window.confirm()` everywhere, no animations, no undo, no real-time |
| **Owner UX Flow** | 4/10 | Functional CRUD but zero workflow intelligence |
| **Customer UX Flow** | 4/10 | Two-tap-to-add, no tracking, no cart persistence, no error recovery |
| **Accessibility** | 2/10 | Broken ARIA, contrast failures, no skip links, no focus management |
| **Information Architecture** | 4/10 | Flat nav, no breadcrumbs, duplicate routes, no 404 |
| **Responsive Design** | 4/10 | Topbar explosion on mobile, jarring table→card transition |
| **Performance** | 5/10 | Redundant API calls, render-blocking fonts, raw CSS injection |
| **Design System** | 2/10 | 7 radius values, 8 letter-spacings, 3 button variants, no tokens |
| **Hedonics (Joy of Use)** | 2/10 | Zero delight. No animations, no empty-state illustrations, no personality beyond gold tint |
| **Pragmatics (Task Efficiency)** | 4/10 | Gets jobs done if you squint, but makes simple tasks harder than they need to be |

**Overall: 3.4 / 10** — Functional scaffolding cosplaying as a product.
