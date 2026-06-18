# Customer Features — ODA Public Ordering

The customer-facing experience is a **mobile-first, zero-auth web app** accessed at `/order/:restaurantRef`. No login or account is required. Here is every feature available.

---

## 1. Table Lookup (Entry Point)

**Route:** `/order/:restaurantRef` (no table query)

The landing page presents a **"Find your table"** card with:

- **Table reference input** — a text field where the customer types the table number (or QR code ref) printed on their table tent
- **"View menu" button** — submits the lookup
- **Country-aware** — the restaurant ref identifies which restaurant they're at

Once submitted, the URL updates to `?table=XX` and stays in the URL on reload. Without a valid table, the customer cannot browse or order.

---

## 2. Menu Browsing

After successful table lookup, the customer sees the restaurant's menu with:

### 2.1 Tab Bar
- **Menu tab** — shows the food/drink catalog
- **Status tab** — shows current/past orders for this table
- **Search field** (embedded in the tab bar on Menu tab) — type to filter menu items by name, description, or category path in real time

### 2.2 Category Navigation
- **Horizontal scrollable pill row** listing all menu categories (e.g., "All", "Appetizers", "Main Course", "Desserts", "Drinks")
- Tapping a category scroll-filter the menu to show only items in that category
- Tapping the active category again resets to show all
- Keyboard-accessible with arrow key navigation
- Sticky below the header

### 2.3 Menu Item Cards (Grid View, default)

Each menu item renders as a card with:

- **Item name** (bold, 15px)
- **Price** (monospace, indigo, primary color)
- **Description** (muted, clamped to 2 lines)
- **Image thumbnail** (88×88px, rounded-xl, with object-position control; shows a placeholder icon if no image)
- **Add button** (circular floating "+" button, positioned at bottom-right of thumbnail, with ring-2 ring-card separation; max quantity 20)
- **Quantity badge** (shows count when ≥1, animated badgePop entrance, smallest monospace)
- **Quantity controls** (when qty > 0, the add button transforms into a stepper: − / count / +, all in a pill overlay)

### 2.4 Detailed Carousel View ("Browse" mode)

Toggle in the header switches from grid to a **full-screen swipeable carousel**:

- **Image hero** — large circular rotating image at top (slow continuous rotation for visual flair)
- **Item name + price + description** below the image
- **Add-to-order** or quantity stepper controls
- **Swipe left/right** (or keyboard arrow keys) to navigate between items
- **Page indicator** — shows "1/24" at bottom

---

## 3. Cart & Ordering

### 3.1 Cart Strip (Bottom Bar)
- Appears as a **fixed floating bar** at the bottom of the screen once at least 1 item is added
- Shows: count badge, item summary (e.g., "Chicken + 2 more"), total price
- Color: primary indigo fill with white text
- Safe-area-aware padding

### 3.2 Cart Sheet (Slide-up Panel)
Tapping the cart strip opens a **bottom sheet** with:

- **Sheet title** — "Your order · N items"
- **Item list** — each item shows name, subtotal, and quantity stepper (− / count / +), max 20 per item
- **Total line** — separator with final total
- **"Place order • TZS XX,XXX" button** — full-width, primary styled, disabled when cart is empty or submitting
- Close button (X) in top-right corner

### 3.3 Order Submission
- POST to `/public/restaurants/:ref/orders` with table number and items array
- Sends: `{ tableNumber, items: [{ id, quantity }] }`
- On success:
  - Cart is cleared
  - Items are collapsed
  - Cart strip disappears
  - A success flash notification appears
  - **Order Result Dialog** appears (see below)

### 3.4 Order Result Dialog
A modal dialog with:

- **Green checkmark icon** with animated entrance
- **"Order placed"** label
- **Order #ID** in bold
- **"Table X — your order is pending"** message
- **Full receipt summary** (item names, quantities, subtotals, total) in a muted container
- **"Back to menu" button** — full-width, primary

---

## 4. Order Status Tracking

### 4.1 Status Tab
Switch to the "Status" tab to see all orders placed from this table:

- **Live dot indicator** (green pulse) on the tab when viewing status
- **Auto-refreshes every 30 seconds**

### 4.2 Order Cards
Each order displays:

- **Order #ID** and **timestamp** (formatted to locale time)
- **Status badge** with icon and color:
  | Status | Label | Icon | Color |
  |--------|-------|------|-------|
  | `pending` | Waiting | 🕐 | Amber |
  | `confirmed` | Cooking | 👨‍🍳 | Orange |
  | `completed` | Served | ✅ | Green |
  | `cancelled` | Cancelled | — | Gray |
- **Item list** — quantity × name, price per line
- **Total** — at bottom with separator

### 4.3 Empty State
When no orders exist, shows:
- Icon + "No orders yet" heading
- "Place an order from the Menu tab and it will appear here."
- **"Browse menu" CTA button** that navigates back to Menu tab

---

## 5. Status & Error States

### Table not looked up
Prompt card: "Enter the table number from your table tent."

### Loading menu
"Getting the menu ready for table X…"

### Table lookup failed
Error card with: "We couldn't find table X", the error message, and the lookup form re-displayed.

### Menu empty
"Menu unavailable — This table is ready, but the menu is empty. Ask staff to add items."

### No items in category
"This category has no items."

### No search results
"No items matched '{term}'. Try a broader search."

### Flash notifications
- **Success** (green/primary): "Order placed successfully" — auto-dismisses after 4.2s
- **Error** (red/destructive): Order submission error — persists until dismissed

---

## 6. Accessibility

- `aria-label` on all interactive elements
- `role="dialog"`, `aria-modal`, `aria-expanded`, `aria-selected` where appropriate
- `aria-live="polite"` on dynamic content (cart, order counts)
- `role="alert"` and `aria-live="assertive"` for error flash messages
- `role="tablist"`, `role="tab"`, `role="tabpanel"` for tab interface
- `role="radiogroup"`, `role="radio"` for segmented controls
- `role="status"` for success notifications
- Keyboard navigation: Tab trap in dialogs, arrow keys in carousel, arrow keys in category nav, Escape to close dialogs
- Screen reader: `sr-only` skip-to-content link, `sr-only` close labels
- Focus management: auto-focus confirm button in dialogs

---

## 7. Responsive & UX Details

- **Mobile-first** — full-height layout (`min-h-dvh`), bottom-safe-area-aware
- **Sticky headers** with backdrop blur (`bg-background/90 backdrop-blur-md`)
- **Animations**: cardIn (staggered entrance), badgePop (quantity badges), fadeIn (dialogs)
- **Press feedback**: `active:scale-90` on buttons, `active:scale-95` on primary
- **Cart state is ephemeral** — stored in React state, lost on refresh (quantities managed client-side)
- **Order tracking is persistent** — fetched from server based on table number, auto-refreshes

---

## 8. Technical Architecture

- **State management**: Context (`MenuInteractionContext`) for menu open/close and quantities; local state for UI
- **Cart logic**: `useCart()` hook — derived state from quantities, computes count/total/summary
- **Table resolution**: `useTableLookup()` hook — manages URL search params, fetches restaurant context from API
- **API endpoints used**:
  - `GET /public/restaurants/:ref/order-context?table=XX` — loads restaurant info, menu tree, menu items
  - `POST /public/restaurants/:ref/orders` — submits order
  - `GET /public/restaurants/:ref/orders?table=XX` — fetches order status (polled every 30s)
- **Frameworks**: React 19, React Router v7, Tailwind CSS v4
- **Currency**: TZS (Tanzanian Shilling) via `Intl.NumberFormat`
