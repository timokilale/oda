# UI Brutal Review

Static UI/UX review of the current frontend from two perspectives:
- Owner trying to do everything the system allows
- Customer trying to do everything the system allows

This is source-backed, not vibes-backed. I did not run a live browser session, so every finding below comes from the code that defines the flows and the styling.

## Implementation Status

### Implemented in this pass

- Owner workspace:
  - Added a real restaurant settings surface with editable profile details, status, phone, address, and image management.
  - Added restaurant switching directly in the owner shell.
  - Reworked menu management into create/edit/archive/restore instead of add/delete-only.
  - Fixed missing layout primitives, toast styling, responsive table behavior, money styling, and mobile card fallbacks.
  - Improved OTP flows so they behave like staged flows instead of resetting unpredictably.
  - Exposed table customer links with copy/open actions.
  - Improved the orders queue with filters, clearer queue messaging, and safer status updates.

- Customer ordering:
  - Split invalid-table, empty-menu, and no-search-results states into distinct experiences.
  - Fixed sticky offset behavior by measuring header/category/cart heights instead of hard-coding guesses.
  - Added search autofocus and proper state reset when the table changes.
  - Added a reviewable cart sheet and a post-submit confirmation dialog with order details.
  - Added responsive mobile behavior and fixed bottom-toast/cart spacing conflicts.
  - Removed time-of-day theme switching and stabilized the default theme.

### Still worth improving later

- Owner order management still lacks a full detail drill-down or richer kitchen-style batching.
- A custom in-app confirmation modal would be better than the remaining native `window.confirm` prompts.
- Customer item fallback visuals can still be made more informative when menu photos are missing.

## Owner Side

### Logical flaws

- Critical: the owner workspace is missing basic management operations. The routed owner surface is only `dashboard`, `orders`, `menu`, `tables`, and `reports`; there is no restaurant settings or edit surface, so once a restaurant is created there is nowhere to rename it, fix location data, or replace its image. Evidence: `src/App.jsx:45-53`, `src/pages/DashboardPage.jsx:31-104`, `src/components/QuickCreateRestaurant.jsx:21-127`.

- Critical: restaurant switching is clumsy and context-breaking. Inside a restaurant, the nav only exposes section tabs for the current restaurant; switching to another restaurant means backing out to the dashboard and starting over. That is friction masquerading as structure. Evidence: `src/components/WorkspaceShell.jsx:49-86`, `src/pages/DashboardPage.jsx:56-95`.

- High: loading and error states for a restaurant dump the shell and fall back to raw text. If workspace fetch fails, the owner loses navigation, context, and recovery options and gets a glorified string on a blank page. Evidence: `src/pages/RestaurantLayout.jsx:35-41`.

- High: the empty dashboard is lazy and unhelpful. "No restaurants" is all the page says; the actual create action lives up in the header, and it can disappear entirely when `resolvedCanAddRestaurant` is false without explaining why. Evidence: `src/pages/DashboardPage.jsx:96-101`, `src/components/WorkspaceShell.jsx:90-95`.

- High: the registration flow sabotages itself. `updateForm` resets `otpRequested` every time any field changes, which means editing city, country, or the image after requesting OTP silently kicks the user out of the verification step. That is a state-management own goal. Evidence: `src/pages/RegisterPage.jsx:30-38`, `src/pages/RegisterPage.jsx:104-225`.

- High: the OTP flows are under-explained and over-fragile. They switch forms midstream, never tell the user where the code was sent, provide no countdown or retry timing, and expose the dev OTP directly in the interface when available. Evidence: `src/pages/LoginPage.jsx:29-130`, `src/pages/RegisterPage.jsx:60-225`.

- High: menu management is one-way and hostile. Owners can add and delete items, full stop. No edit, no archive, no availability toggle, no duplicate, no reorder. One typo in price or name and the only supported "fix" is deletion. Evidence: `src/pages/MenuPage.jsx:46-98`, `src/pages/MenuPage.jsx:134-299`.

- High: destructive actions are inconsistent and cheap. Menu and table deletion use `window.confirm`, order status changes use no confirmation at all, and there is no undo anywhere. This is not a professional operations surface; it is a set of traps. Evidence: `src/pages/MenuPage.jsx:82-97`, `src/pages/TablesPage.jsx:50-65`, `src/pages/OrdersPage.jsx:31-44`, `src/pages/OrdersPage.jsx:118-159`.

- Medium: the tables page hides the most useful table information. The UI gives download/delete, but no copy-link or open-link action for the live ordering URL, even though the table model includes QR target data. Owners cannot easily test the customer flow from their own workspace. Evidence: `src/pages/TablesPage.jsx:121-152`, `server/src/services/owner/tables.js:23-31`.

- Medium: the orders page is a dead-end queue. It shows rows and status buttons, but no order detail view, no drill-in, no filtering, no prioritization, no kitchen-friendly grouping, and no per-row pending state while status updates are in flight. Evidence: `src/pages/OrdersPage.jsx:92-165`.

- Medium: quick-create restaurant is placeholder soup. Three unlabeled text fields, no cancel affordance, and errors rendered as muted body text instead of actual error treatment. Fast entry is fine; hiding semantics is not. Evidence: `src/components/QuickCreateRestaurant.jsx:59-127`.

### Visual and HCI flaws

- Critical: the owner layout primitives are half-built. `metric-grid` and `split-layout` are used like layout containers all over the app, but the stylesheet never gives them `display: grid` or `display: flex`, and `qr-grid` is not defined at all. This is styling cosplay, not layout engineering. Evidence: `src/template-workspace.css:420-423`, `src/template-workspace.css:562-564`, `src/pages/MenuPage.jsx:115-135`, `src/pages/MenuPage.jsx:134-300`, `src/pages/ReportsPage.jsx:45-64`, `src/pages/TablesPage.jsx:121-152`.

- Critical: the owner toast system is visibly unfinished. `FlashStack` renders `flash-stack`, `flash`, and `flash__body`, but the workspace stylesheet only sets `top/right`, some border colors, and dismiss text color. There is no positioning model, no body layout, and no proper stack styling. Evidence: `src/components/FlashStack.jsx:24-35`, `src/template-workspace.css:660-704`.

- High: the owner tables are not mobile-ready. Orders, menu, and reports all use wide tables, they add `data-label` attributes as if a mobile fallback was planned, and then the CSS never uses those labels and never provides a responsive table pattern. On a phone, this will collapse into horizontal misery. Evidence: `src/pages/OrdersPage.jsx:92-165`, `src/pages/MenuPage.jsx:251-293`, `src/pages/ReportsPage.jsx:104-123`, `src/template-workspace.css:713-716`, `src/template-workspace.css:819-835`, `src/template-workspace.css:858-905`.

- High: money styling is referenced but never defined. `mono-total` gets applied to totals, but there is no matching rule in the workspace stylesheet. The interface is literally asking for hierarchy it does not render. Evidence: `src/pages/OrdersPage.jsx:111-113`, `src/pages/MenuPage.jsx:282-284`, `src/pages/ReportsPage.jsx:117-119`.

- High: the typography keeps choosing mood over legibility. The workspace base is `13px` mono, then it piles on `11px` and `12px` labels, nav chips, stats, buttons, and status pills. It looks curated until you imagine an actual owner using it for hours. Then it just looks stingy. Evidence: `src/template-workspace.css:176-183`, `src/template-workspace.css:269-273`, `src/template-workspace.css:534-560`, `src/template-workspace.css:570-589`, `src/template-workspace.css:605-617`.

- Medium: the nav deliberately hides overflow and scrollbars, which kills discoverability on smaller screens. If tabs overflow, the UI fades them out at the edge and removes the scrollbar entirely. Very elegant. Also very easy to miss. Evidence: `src/template-workspace.css:240-249`.

- Medium: time-based theming makes the product feel unstable. The whole interface changes by clock time, not by user choice or restaurant branding. That is novelty, not consistency. Evidence: `index.html:16`, `public/theme.js:1-14`.

- Medium: empty and loading states are just bland text blocks. "Loading restaurants", "No items", "No tables", "No sales" and friends provide almost no next-step guidance. The UI keeps asking the user to infer what to do next. Evidence: `src/pages/DashboardPage.jsx:48-54`, `src/pages/MenuPage.jsx:246-298`, `src/pages/TablesPage.jsx:113-159`, `src/pages/ReportsPage.jsx:99-127`.

## Customer Side

### Logical flaws

- Critical: invalid table, empty menu, and empty search all collapse into the same dumb outcome. If table lookup fails, `context` is cleared and a flash error is shown, but the main content still falls through to "No dishes matched that search." That message is wrong for an invalid table and wrong for an empty menu. Evidence: `src/pages/PublicOrderPage.jsx:41-67`, `src/pages/PublicOrderPage.jsx:223-261`.

- Critical: the section-jump logic ignores fixed chrome. `scrollIntoView({ block: "start" })` is used even though the page has a fixed header and a sticky category strip, so the section you jump to can land under the interface that is supposed to help you navigate. Evidence: `src/pages/PublicOrderPage.jsx:127-133`, `src/template-order.css:115-128`, `src/template-order.css:211-216`.

- High: the active category state lies. It updates on click and filter reset, not on scroll position, so the highlighted category can stop matching what the customer is actually reading. Evidence: `src/pages/PublicOrderPage.jsx:82-95`, `src/pages/PublicOrderPage.jsx:127-133`, `src/components/public-order/MenuCategoryNav.jsx:3-19`.

- High: search opens but does not focus. The user taps the search icon and then still has to tap the input. On a public ordering flow, that is needless friction. Evidence: `src/pages/PublicOrderPage.jsx:177-213`.

- High: table changes do not reset all the right state. Loading a new table clears `context` and `openNodes`, but search text and quantities survive. So customers can carry stale filters and cart state across table changes. Evidence: `src/pages/PublicOrderPage.jsx:37-67`, `src/pages/PublicOrderPage.jsx:97-119`.

- High: the cart is not reviewable. The bottom strip shows item count, total, and "first item + N more", but there is no full cart view, no per-item review, and no global edit surface. Customers have to hunt back through the menu to audit their own order. Evidence: `src/pages/PublicOrderPage.jsx:164-169`, `src/components/public-order/CartStrip.jsx:10-24`, `src/components/public-order/MenuNode.jsx:121-177`.

- High: post-submit feedback is paper-thin. The order places, the cart clears, and the only confirmation is a toast. No order number, no summary, no table confirmation screen, no "we sent this to the kitchen", nothing. Evidence: `src/pages/PublicOrderPage.jsx:138-161`, `src/components/public-order/CartStrip.jsx:20-23`.

- Medium: the category strip renders even when it has nothing to say. `MenuCategoryNav` is always mounted, so the customer gets an empty sticky strip before any table is loaded and after any fatal lookup failure. That is dead chrome taking up prime screen space. Evidence: `src/pages/PublicOrderPage.jsx:216-220`, `src/components/public-order/MenuCategoryNav.jsx:3-19`.

- Medium: the table lookup screen assumes too much. It is just an input and a button with no real context, no example flow, no fallback guidance, and no explanation of what a table reference looks like if the QR route fails. Evidence: `src/components/public-order/TableLookupForm.jsx:3-17`, `src/pages/PublicOrderPage.jsx:223-230`.

- Medium: missing item descriptions get fake prose. Showing "Available now." when there is no description is fabricated content, not helpful content. The UI is pretending data exists because silence was apparently too honest. Evidence: `src/components/public-order/MenuNode.jsx:142-145`.

- Medium: the expanded search header can overlap content because the shell padding is static. The page reserves `80px` at the top, but the fixed header grows when search opens. The structure does not actually honor its own expanded chrome. Evidence: `src/template-order.css:109-112`, `src/template-order.css:175-191`, `src/pages/PublicOrderPage.jsx:177-213`.

### Visual and HCI flaws

- Critical: the public ordering page has no responsive media queries at all. None. For a surface named "ODA Mobile", that is embarrassing. Evidence: `src/template-order.css:1-705`.

- Critical: the grain overlay sits above the UI. `body::after` is fixed at `z-index: 9000`, while the header, cart, and flash stack sit lower. Pointer events are disabled, but the visual film is still painted over everything. That is self-inflicted contrast damage. Evidence: `src/template-order.css:98-105`, `src/template-order.css:115-121`, `src/template-order.css:553-566`, `src/template-order.css:624-632`.

- Critical: the bottom cart can hide the last menu items. The shell reserves `var(--cart-strip-h)`, but nothing in the page or cart components sets that variable. The code clearly expects measured cart height and never actually provides it. This is an inference from source. Evidence: `src/template-order.css:109-112`, `src/template-order.css:553-567`, `src/pages/PublicOrderPage.jsx:12-270`, `src/components/public-order/CartStrip.jsx:1-27`.

- High: the public page repeats the tiny-text obsession. Chips, category tabs, buttons, badges, and helper copy sit around `10px` to `13px`, often in mono and uppercase. That is not premium; that is hostile to tired eyes in bright restaurants. Evidence: `src/template-order.css:87-95`, `src/template-order.css:146-154`, `src/template-order.css:230-243`, `src/template-order.css:533-535`, `src/template-order.css:574-612`, `src/template-order.css:674-689`.

- High: the table lookup input is visually naked. It reuses `search-input`, which is borderless and backgroundless, so the first-run entry state looks like stray text floating in space rather than a deliberate step. Evidence: `src/components/public-order/TableLookupForm.jsx:3-17`, `src/template-order.css:193-208`, `src/template-order.css:544-550`.

- High: the first screen is over-chromed. Fixed header, table chip, search toggle, sticky category strip, grain overlay, and bottom cart mechanics all crowd the surface before the user has even looked at food. The chrome has more personality than the task flow. Evidence: `src/pages/PublicOrderPage.jsx:177-220`, `src/template-order.css:115-253`, `src/template-order.css:553-622`.

- Medium: fallback item visuals are decorative camouflage. When there is no image, the card uses a generated hue block plus a dramatic overlay. That is stylish nonsense, not an informative empty state. Evidence: `src/components/public-order/MenuNode.jsx:113-119`, `src/template-order.css:392-435`.

- Medium: toast placement competes with the primary CTA zone. Flash messages and the cart both live at the bottom, so when the cart is visible the feedback layer can fight the ordering layer for the same screen estate. Evidence: `src/components/FlashStack.jsx:24-35`, `src/template-order.css:553-566`, `src/template-order.css:624-642`.

- Medium: time-based theming hurts the customer side too. The ordering interface changes by hour, not by restaurant identity or customer preference. That makes the product feel less trustworthy, not more atmospheric. Evidence: `index.html:16`, `public/theme.js:1-14`.

## Bottom Line

The owner side looks like a design exercise that forgot operations are repetitive, high-risk, and time-sensitive. The customer side looks like a mood board that occasionally remembers food ordering exists.

The codebase absolutely has style, but it keeps spending usability to buy it. The biggest recurring sins are:
- layout primitives that are not actually implemented
- workflow states that collapse into vague or wrong messages
- chrome that is heavier than the task
- missing edit/review/recovery paths
- typography that performs taste while punishing readability
