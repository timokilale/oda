# Management Features — ODA Owner Workspace

The management interface is a **protected, authenticated web app** at `/restaurants/:restaurantId/*` with 5 core tabs: **Orders**, **Menu**, **Tables**, **Reports**, **Settings**. It requires phone + OTP login.

This document covers every feature available to restaurant owners, maps each customer-facing feature to its management counterpart, and identifies gaps where the customer UI shows data the management interface cannot configure.

---

## 1. Authentication & Onboarding

### 1.1 Owner Registration
- Phone-based OTP registration
- Fields: phone number, restaurant name, address, city, country
- Auto-creates first restaurant on registration
- Session via cookie (`oda_owner_token`)

### 1.2 Login
- OTP sent to phone number
- 6-digit code verification
- "Remember me" is implicit (stays logged in until explicit logout)
- Dev mode: OTP code shown in console for testing

### 1.3 Multi-Restaurant Support
- Single owner can manage multiple restaurants (subject to `ownerCanAddRestaurant` limit)
- Dashboard lists all owned restaurants with key metrics per card
- Quick switcher via dropdown in workspace header
- Auto-redirect to single restaurant's orders page if owner has exactly one

### 1.4 Setup Wizard (`/setup`)
4-step guided flow for new restaurants:

1. **Add first items** — inline form: name + price only (category defaults to "Main")
2. **Create a table** — one-click: creates "Table 1"
3. **Place a test order** — user manually orders via customer menu, then confirms (client-side flag + confetti)
4. **Go live** — one-click: activates restaurant, redirects to orders page

---

## 2. Dashboard (`/dashboard`)

**Customer feature it powers:** The restaurant entry point (name, image, location) on the customer menu page.

**What exists:**
- Restaurant cards with: image (with position offset), name, active/inactive badge, city/country, open order count, menu item count, table count
- "New restaurant" button (subject to ownership limit)
- Empty state with CTA to create restaurant
- Auto-redirect for single-restaurant owners

**Gaps:**
- No aggregated analytics overview (revenue across all restaurants, total orders, etc.)
- No way to reorder restaurants on the dashboard

---

## 3. Menu Management

This section controls everything the customer sees on their menu page.

### 3.1 Menu Item Fields

| Field | Type | Customer Shows | Management Can Set | Notes |
|---|---|---|---|---|
| **Name** | text | ✅ Bold heading | ✅ Yes (required) | |
| **Price** | number | ✅ Formatted currency | ✅ Yes (required) | |
| **Category** | string | ✅ Filter chips / badge | ✅ Yes (dropdown + datalist suggestions) | Auto-saved as suggestion for future items |
| **Description** | text | ✅ Body text (clamped to 2 lines) | ✅ Yes (optional) | |
| **Image** | file/URL | ✅ Thumbnail + carousel hero | ✅ Yes (file upload with pan/crop) | Client-side cropped to 1280×960 (4:3) |
| **Image position** | 0-100% | ✅ `object-position` applied | ✅ Yes (interactive pan via `ImagePositionField`) | Default 50/50 |
| **Active/Archived** | boolean | ✅ Controls visibility | ✅ Yes (toggle in editor + filter) | Archived items hidden from customers |

**What the customer UI shows that is NOT manageable:**

| Customer Feature | Current Default | Gap |
|---|---|---|
| **Badges** ("Popular", "New", "Chef's Pick", etc.) | None shown | No field to assign badges per item |
| **Ingredients list** | Not shown in current UI (stitch components show it in `DishDetailModal`) | No field to store ingredients |
| **Calories / nutritional info** | Not shown in current UI (stitch components show it in `DishDetailModal`) | No fields for calories, macros, or allergens |
| **Prep time** | Not shown (stitch component has a "Time" field in `DishDetailModal`) | No field for prep/cook time |
| **Spiciness level** | Not shown (stitch component has "Spiciness" in DishDetailModal) | No field for spice level |
| **Color leak glow** | Randomly assigned from palette | No field to set per-item visual accent color |
| **Display order / sort priority** | Items appear in API order | No way to reorder items within a category |
| **Multiple images per item** | Single image | No support for gallery/multiple angles |

### 3.2 Menu List (`/restaurants/:id/menu`)
- Table display of all items with: name, price, category (inline badge), active/archived status (opacity)
- Filter tabs: Available (active) / Archived / All
- Inline archive/restore toggle with optimistic UI
- Slide-over editor panel (`MenuItemEditor`) for editing
- Links to "Add items" page

### 3.3 Item Creation (`/restaurants/:id/menu/new`)
**Two modes:**

**Single item:**
- Fields: name (required), price (required), category, description (optional)
- No image during create (only in edit)

**Bulk upload (Excel):**
- Upload `.xlsx` / `.xls` files
- Auto-detects columns by header matching: Name, Price, Category, Description
- Preview table of parsed rows (first 50)
- Sequential POST per row (not batch)

### 3.4 Item Editor (`MenuItemEditor`)
- Slide-over sheet triggered from menu list
- Fields: name, price, category, description, active toggle
- Image upload with interactive crop/pan (`ImagePositionField`)
- Remove image toggle
- Image position X/Y sliders
- Save triggers `PATCH /restaurants/:id/menu-items/:id`

### 3.5 Menu Gaps (Features Customer Shows But Management Can't Configure)

| # | Customer-Facing Element | Source | Management Action Needed |
|---|---|---|---|
| 1 | **Item badges** (Popular, New, Vegan, Chef's Pick) | Hardcoded in stitch UI or absent | Add badge/tag field per item |
| 2 | **Ingredients list** | `DishDetailModal` shows "Key Ingredients" | Add multiline or array field per item |
| 3 | **Calories** | `DishDetailModal` shows calorie count | Add numeric field per item |
| 4 | **Prep time** | `DishDetailModal` shows "X min" | Add numeric field per item |
| 5 | **Spiciness level** | `DishDetailModal` shows spice indicator | Add numeric/select field per item |
| 6 | **Visual accent glow** | Random color assigned in `transformMenuItem` | Add color picker field per item (or use category-based default) |
| 7 | **Item display ordering** | API order (unsorted) | Add `sort_order` integer field + reorder UI |
| 8 | **Category icons/emojis** | Not shown (plain text) | Add icon per category field |

---

## 4. Table Management

**Customer feature it powers:** The `?table=XX` entry point — each table generates a unique QR code URL.

### 4.1 Table List (`/restaurants/:id/tables`)
- Grid of table cards
- Each card: table number, QR code image (or placeholder)
- Actions per table: Download (PNG), Share (Web Share API or copy link), Delete (with confirmation)
- "Print all" button: opens print window with all QR codes formatted for printing
- "Add tables" link

### 4.2 Table Creation (`/restaurants/:id/tables/new`)
- Add draft table cards, each with a modal to set table number
- Table number: free-form text input ("1", "2", "A1", "VIP-3")
- Duplicate detection (case-insensitive)
- Sequential POST per table on submit

### 4.3 Table Gaps

| # | Gap | Impact |
|---|---|---|
| 1 | **No table capacity** | Can't show "Table seats X people" |
| 2 | **No area/zone assignment** | Can't group tables (indoor, patio, bar) |
| 3 | **No table description** | Can't show "Window table" or "VIP booth" |
| 4 | **No table layout/map** | No visual floor plan of the restaurant |
| 5 | **No merge/split tables** | Can't combine tables for large parties |
| 6 | **Manual number entry only** | No auto-numbering or range creation |

---

## 5. Order Management

**Customer feature it powers:** The status tracking tab — customers see their order progress in real time.

### 5.1 Order List (`/restaurants/:id/orders`)
- Real-time updates via Server-Sent Events (`/api/restaurants/:id/orders/sse`)
- 7-second polling fallback after 12s SSE timeout
- Sound notification on new orders (Web Audio API, 880Hz sine tone, 400ms)
- Accepting orders toggle (top right): deactivates restaurant entirely

**Order status workflow:**

```
pending ──► confirmed ──► completed
   │                        ▲
   └─────── cancelled ──────┘
```

**Per-order display:**
- Table number (prominent)
- Time elapsed ("placed 5m ago", "1h 23m ago")
- Items summary or fallback `#orderId`
- Total amount (formatted as TZS)

**Status actions:**
| Current Status | Available Actions |
|---|---|
| `pending` | Accept (→ confirmed), Cancel |
| `confirmed` | Serve (→ completed) |
| `completed` | "Served" badge (read-only) |
| `cancelled` | "Cancelled" badge (read-only) |

**Additional features:**
- Filter: Active (pending+confirmed), Served (completed+cancelled), All
- Group by table toggle
- Undo accept: toast with 4s timeout
- Optimistic UI with rollback on error

### 5.2 Order Management Gaps

| # | Gap | Customer Impact |
|---|---|---|
| 1 | **No order detail view** | Can't see line-item breakdown or notes from management side |
| 2 | **No order editing** | Can't modify items, quantities, or prices on an existing order |
| 3 | **No customer notes visibility** | `DishDetailModal` allows "Special Chef Instructions" but management never sees them — not sent to API or displayed |
| 4 | **No estimated time** | Can't set or display "Estimated wait: 12 mins" |
| 5 | **No rejection reason** | When cancelling, no field to explain why (customer sees "Cancelled" only) |
| 6 | **No order history search** | No way to search/filter past orders by item, table, or date range |
| 7 | **No split/combine orders** | Can't split a large order across tables or combine small ones |

---

## 6. Reports & Analytics (`/restaurants/:id/reports`)

**Customer feature it powers:** Indirect — helps owners understand what's selling.

### 6.1 Available Metrics
- Period selector: Today / This week / This month / All time
- 10-order minimum threshold before data shows
- 4 metric cards: Revenue, Orders, Avg. ticket, Completion rate
- Status breakdown: Pending, Confirmed, Completed, Cancelled counts
- Top items (up to 5): name, quantity sold, revenue

### 6.2 Reports Gaps

| # | Gap | Notes |
|---|---|---|
| 1 | **No charts or graphs** | All numeric, no visualizations |
| 2 | **No time-series trends** | Can't see daily/weekly/monthly patterns |
| 3 | **No category breakdown** | Can't see which categories drive revenue |
| 4 | **No profit/cost analysis** | No cost data input, no margin calculation |
| 5 | **No export** | Can't export to CSV, PDF, or Excel |
| 6 | **No peak hours analysis** | No insight into busiest times |
| 7 | **No item-level trends** | Can't see if an item is gaining or losing popularity |
| 8 | **No table utilization** | Can't see which tables generate the most orders |

---

## 7. Restaurant Settings (`/restaurants/:id/settings`)

**Customer feature it powers:** Restaurant name, image, and contact info on the customer menu page header.

### 7.1 Configured Fields

| Field | Customer Display | Management |
|---|---|---|
| **Restaurant name** | ✅ Header text on customer page | ✅ Editable |
| **Restaurant image** | ✅ Header / menu page (via API) | ✅ Upload with crop/pan (1200×900) |
| **Address + city + country** | ❌ Not shown on customer page currently | ✅ Editable (for internal reference) |
| **Phone number** | ❌ Not shown on customer page currently | ✅ Editable (with OTP verification) |
| **Active/Inactive** | ✅ Controls menu visibility | ✅ Toggle switch |
| **Customer menu link** | — | ✅ Displayed as copyable URL |

### 7.2 Settings Gaps

| # | Missing Setting | Why It Matters |
|---|---|---|
| 1 | **Opening hours** | Customer can't know if restaurant is currently open |
| 2 | **Tax / VAT rate** | Currently hardcoded at 0% (backend) or not applied; stitch shows 8.25% tax + 10% service charge |
| 3 | **Service charge rate** | No configurable service charge field |
| 4 | **Currency** | Hardcoded to TZS in `format.js`; stitch mock uses USD |
| 5 | **Payment methods** | No cash, card, mobile money options configured |
| 6 | **Menu layout/theme** | No way to customize colors, fonts, or branding on customer page |
| 7 | **Auto-accept orders** | No setting to auto-confirm pending orders |
| 8 | **Printing / KOT settings** | No kitchen printer integration |
| 9 | **Language** | No localization options |
| 10 | **User management** | Single owner account only; no staff/waiter accounts |

---

## 8. Complete Feature Gap Matrix

Every customer-facing element mapped to its management data source and whether the management interface can control it.

### Menu Items (Customer Sees These)

| Customer Element | Management Source | Configurable? |
|---|---|---|
| Item name | `menuItem.name` | ✅ Yes |
| Item price | `menuItem.price` | ✅ Yes |
| Item description | `menuItem.description` | ✅ Yes (optional) |
| Item image | `menuItem.imageUrl` | ✅ Yes (upload + crop + pan) |
| Item category | `menuItem.category` | ✅ Yes |
| Item active/inactive | `menuItem.active` | ✅ Yes (archive toggle) |
| **Badges** (Popular, New, Vegan, Chef's Pick) | — | ❌ **Not available** |
| **Ingredients list** | — | ❌ **Not available** |
| **Calories / nutritional info** | — | ❌ **Not available** |
| **Prep time** | — | ❌ **Not available** |
| **Spiciness level** | — | ❌ **Not available** |
| **Display order** | — | ❌ **Not available** |
| **Color accent / visual theme per item** | — | ❌ **Not available** |
| **Special notes field for customers** | — | ❌ Sent in request but **no backend processing visible** |

### Restaurant (Customer Sees These)

| Customer Element | Management Source | Configurable? |
|---|---|---|
| Restaurant name | `restaurant.name` | ✅ Yes |
| Table number | `table.tableNumber` | ✅ Yes (on create) |
| Restaurant ref (URL slug) | `restaurant.ref` | ❌ Auto-generated, not editable |
| Menu availability | `restaurant.active` | ✅ Yes (accepting orders toggle) |
| Restaurant image | `restaurant.imageUrl` | ✅ Yes (upload + crop) |
| **Opening hours indicator** | — | ❌ **Not available** |
| **Tax / service charge display** | — | ❌ **Not available** |

### Orders (Customer Sees These)

| Customer Element | Backend Source | Management Can Control? |
|---|---|---|
| Order ID | `order.id` | ✅ Read-only |
| Order status | `order.status` | ✅ Yes (Accept, Serve, Cancel) |
| Items ordered | `order.items` | ✅ Read-only |
| Total amount | `order.totalAmount` | ✅ Read-only |
| **Estimated prep time** | — | ❌ **Not available** — not stored or displayed |
| **Status progression animation** | — | ⚠️ Stitch timeline maps statuses to visual steps |
| **Cancellation reason** | — | ❌ **Not available** |

---

## 9. Technical Architecture

### 9.1 API Endpoints (Management)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/restaurants` | List owned restaurants |
| GET/PATCH | `/restaurants/:id` | Read/update restaurant details |
| GET/POST | `/restaurants/:id/menu-items` | List/create menu items |
| PATCH | `/restaurants/:id/menu-items/:id` | Update menu item |
| GET/POST/DELETE | `/restaurants/:id/tables` | CRUD tables |
| GET | `/restaurants/:id/tables/:id` | Get single table |
| GET | `/restaurants/:id/orders` | List orders |
| PATCH | `/restaurants/:id/orders/:id/status` | Change order status |
| SSE | `/api/restaurants/:id/orders/sse` | Real-time order updates |
| GET | `/restaurants/:id/reports` | Get reports (`?period=`) |
| POST | `/auth/me` | Session check |
| POST | `/auth/logout` | Logout |

### 9.2 Data Flow

```
Management creates menu items ──► API (MySQL) ──► Customer fetches via GET /public/.../order-context
Management creates tables ──► API ──► QR code printed ──► Customer scans ──► /order/:ref?table=X
Customer places order ──► POST /public/.../orders ──► API ──► SSE pushes to OrdersPage
Management confirms/ serves ──► PATCH status ──► API ──► Customer polls GET /public/.../orders
```

### 9.3 Dependencies
- **Auth**: Cookie-based sessions (`oda_owner_token`)
- **API client**: `apiRequest()` in `src/lib/api.js` — wraps fetch with timeout, logging, error handling
- **Image processing**: Client-side canvas cropping via `createCroppedUpload` (1280×960 for menu items, 1200×900 for restaurants)
- **Real-time**: Server-Sent Events with polling fallback
- **State management**: React Context (`AuthContext`, `RestaurantWorkspaceContext`); local state per page
- **UI library**: Tailwind CSS v4 + shadcn/ui components + Lucide icons
- **Testing**: Vitest + `@testing-library/react`

---

## 10. Priority of Gaps to Fill

Based on what the stitch customer UI now renders, these gaps should be filled in priority order:

### P0 — Customer Sees Broken/Empty Data
| Gap | Why |
|---|---|
| **Special notes not persisted** | Customer writes notes in `DishDetailModal` but they're not sent in the API request — they're silently dropped |
| **Estimated time / prep time** | Customer timeline shows "in queue" / "estimated wait" but no field exists to set or compute this |

### P1 — Customer UI Renders These (Would Show Empty)
| Gap | Why |
|---|---|
| **Badges** | `MenuSwiper` and `GridView` have dedicated badge UI — currently blank for all items |
| **Ingredients** | `DishDetailModal` renders "Key Ingredients" section — would show nothing |

### P2 — Nice Additions That Match the UI
| Gap | Why |
|---|---|
| **Calories** | `DishDetailModal` shows calorie count |
| **Prep time** | `DishDetailModal` shows timing |
| **Spiciness** | `DishDetailModal` has spiciness indicator |
| **Tax / service charge** | Not displayed in current customer UI but shown in stitch mock; would be useful |
