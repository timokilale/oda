# UI/UX Ruthless Review - Current Findings

Date: 2026-04-27

Scope:
- Owner workspace: dashboard, restaurant shell, orders, menu, tables, reports, settings, auth.
- Customer ordering: table lookup, menu browsing, cart review, order submission.
- Review basis: source inspection plus `npm run build`, `npm run test:frontend`, and `npm run test:server`.

Verdict: do not pass this UI yet.

The project is materially better than the older review notes in this repository, but there are still enough product-quality failures to reject it under a strict UI/UX bar. The main problems are fake controls, fake reporting filters, weak modal accessibility, invalid interactive markup, and an interface style that often performs elegance at the expense of operational clarity.

## Verification

- `npm run build`: passed.
- `npm run test:frontend`: passed, 4 files and 6 tests.
- `npm run test:server`: initially blocked by sandbox `spawn EPERM`; passed after running outside sandbox, 9 tests.

Passing tests do not mean the UX passes. The current tests cover routing, API behavior, and a happy public-order path. They do not cover visual hierarchy, keyboard flow, modal focus, small-screen usability, or whether controls tell the truth.

## Blockers

### 1. Table cards have a fake collapse control

Evidence:
- `src/pages/TablesPage.jsx:252`

Problem:
- `const isExpanded = true//expandedTableId === table.id;`
- Every table card is forced open.
- The button still says "Hide actions" and toggles `expandedTableId`, but that state has no visual effect.

Why this fails:
- The UI lies. A visible affordance promises expansion/collapse and does not deliver.
- This is not a subtle defect. It is exactly the kind of broken interaction that makes users distrust the rest of the product.

Fix:
- Restore `const isExpanded = expandedTableId === table.id;`
- Decide whether the default state should be collapsed or first-card-open.
- Add a frontend test proving hide/show changes the visible actions.

### 2. Report period filters appear functional but are ignored by the server

Evidence:
- `src/pages/ReportsPage.jsx:28`
- `server/src/routes/owner/reportRoutes.js:7`
- `server/src/services/owner/reports.js`
- `server/src/repository.js:250`

Problem:
- Frontend sends `?period=today`, `?period=week`, or `?period=month`.
- The route ignores `req.query.period`.
- Repository report queries do not filter by date range.

Why this fails:
- This is fake analytics. A segmented control that changes nothing is worse than no filter.
- Owners will make decisions from numbers that appear scoped but are not.
- The metric label "Orders today" remains visible regardless of selected period, compounding the confusion.

Fix:
- Parse and validate the period on the server.
- Apply date filtering consistently to totals, average ticket, completion, and top items.
- Change labels based on period, for example "Orders" or "Orders in period".
- Add tests that prove each period changes the query result.

### 3. Destructive confirmation dialogs focus the dangerous action by default

Evidence:
- `src/components/ConfirmDialog.jsx:21`
- `src/components/ConfirmDialog.jsx:23`
- `src/components/ConfirmDialog.jsx:92`

Problem:
- The comment says "Focus the cancel button by default".
- The code focuses `confirmBtnRef`, which is attached to the confirm/destructive button.

Why this fails:
- For delete, cancel, and logout flows, default focus should not land on the irreversible or dangerous action.
- Keyboard users can accidentally confirm a destructive action with a single Enter press.
- The comment and implementation disagree, which makes future maintenance more dangerous.

Fix:
- Add a `cancelBtnRef`.
- Focus cancel by default for destructive dialogs.
- Consider requiring a stronger confirmation for table deletion because printed QR codes stop working.

### 4. Public menu cards contain nested interactive controls

Evidence:
- `src/components/public-order/MenuNode.jsx:131`
- `src/components/public-order/MenuNode.jsx:160`
- `src/components/public-order/MenuNode.jsx:162`

Problem:
- A full item card is a `<button>`.
- Inside it, quick-add is a `<span role="button" tabIndex={0}>`.
- That creates an interactive control inside another interactive control.

Why this fails:
- Invalid interaction model.
- Screen readers and keyboard users may get confusing behavior.
- Event handling relies on `stopPropagation`, which is brittle.
- The visual quick-add action is central to ordering, so it cannot be treated as a hack inside a larger button.

Fix:
- Make the card container non-button markup.
- Use separate real `<button>` elements for expand and quick-add.
- Ensure each button has an accessible name and predictable focus order.

### 5. Public cart review and success overlays are modal visually, but not modal behaviorally

Evidence:
- `src/components/public-order/CartStrip.jsx:27`
- `src/pages/PublicOrderPage.jsx:412`
- `src/template-order.css:867`

Problem:
- Cart review and order success cover the screen.
- They do not trap focus.
- They do not restore focus when closed.
- Order success listens for Escape on the overlay node, not on document focus, so Escape only works if focus happens to be inside it.

Why this fails:
- Mouse users see a modal. Keyboard and assistive-tech users do not get a reliable modal contract.
- Focus can remain behind the overlay.
- Closing can strand users in an unpredictable place.

Fix:
- Reuse `WorkspaceDialog`/`ConfirmDialog` patterns or create a proper public modal component.
- Trap focus, focus the first meaningful action on open, return focus on close.
- Wire Escape handling at document level while open.

## High Severity UX Issues

### 6. Public ordering shows only one active top-level category at a time

Evidence:
- `src/pages/PublicOrderPage.jsx:363`
- `src/pages/PublicOrderPage.jsx:381`
- `src/components/public-order/MenuCategoryNav.jsx`

Problem:
- Category tabs replace the visible root category instead of scrolling through a continuous menu.
- Search results across categories are not presented as a full result list; the user has to switch categories.

Why this fails:
- Customers cannot naturally scan the menu.
- Search becomes fragmented. A user searching "chicken" may not realize there are matches in other categories.
- Category tabs behave more like app tabs than a menu navigation aid.

Fix:
- Prefer a continuous menu with sticky category nav and scrollspy.
- For search, show all matched categories/items in one result surface.
- If tabs are retained, show match counts in each tab.

### 7. Category tab keyboard navigation changes state without moving focus

Evidence:
- `src/components/public-order/MenuCategoryNav.jsx:13`
- `src/components/public-order/MenuCategoryNav.jsx:34`

Problem:
- Arrow keys update active category.
- Focus remains on the old tab.

Why this fails:
- Roving tab index is incomplete.
- Keyboard users lose orientation because visual selection and DOM focus diverge.

Fix:
- After arrow selection, focus the newly active tab.
- Or use native scrollable buttons without tab roles if this is not actually a tab panel system.

### 8. Owner order queue is still too shallow for real operations

Evidence:
- `src/pages/OrdersPage.jsx:272`

Problem:
- Orders are a table of summaries.
- There is no detail drawer, no expanded item list, no kitchen view, no batching, no urgency cues, no table grouping, and no per-item lifecycle.

Why this fails:
- A restaurant order screen is not a static database table.
- Staff need to quickly answer: what is new, what is late, what belongs together, what changed, what needs action.

Fix:
- Add an order detail drawer or expandable row.
- Add elapsed time, priority/age indicators, and grouped open orders.
- Consider a kitchen mode separate from management/reporting.

### 9. Batch creation uses a cute board pattern where a dense form would be faster

Evidence:
- `src/pages/MenuCreatePage.jsx:192`
- `src/pages/TablesCreatePage.jsx`

Problem:
- Menu and table creation hide details behind draft cards and dialogs.
- Creating many items/tables requires repeated open/edit/close actions.

Why this fails:
- Restaurant setup is data entry. The UI optimizes for presentation, not throughput.
- A board may look polished in a demo but becomes friction in real onboarding.

Fix:
- Use inline editable rows for batch creation.
- Keep dialogs only for advanced fields like image/crop.
- Add duplicate row, paste/import, and validation directly in the grid.

### 10. "Orders today" label remains under every report period

Evidence:
- `src/pages/ReportsPage.jsx:70`

Problem:
- The report can be set to all time, month, or week.
- The metric still reads "Orders today".

Why this fails:
- Labels must reflect filters.
- If a dashboard label is wrong, every number becomes suspect.

Fix:
- Rename the metric to "Orders" when scoped.
- Or display both "Orders in period" and "Orders today" separately.

### 11. Tables metrics include a restaurant name as a giant metric value

Evidence:
- `src/pages/TablesPage.jsx:240`

Problem:
- A metric card labeled "Workspace" displays `restaurant.name` as a metric value.

Why this fails:
- Long restaurant names will overflow or dominate the metric row.
- It mixes identity content with numeric status cards.
- It makes the card grid visually unstable.

Fix:
- Remove it from metric cards.
- Put restaurant identity in the page subtitle/header.

## Medium Severity UX Issues

### 12. Restaurant dashboard cards are whole-card links with no secondary actions

Evidence:
- `src/pages/DashboardPage.jsx:58`

Problem:
- A restaurant card only opens orders.
- There are no direct actions for settings, menu, tables, or reports.

Why this matters:
- Owners returning to the dashboard often know exactly where they want to go.
- Making the whole card one default route forces unnecessary navigation.

Fix:
- Add compact secondary actions or a split menu.
- Keep the primary card action, but expose common destinations.

### 13. Archived/completed order rows still spend table space saying "No action"

Evidence:
- `src/pages/OrdersPage.jsx:347`

Problem:
- Non-actionable rows render a muted "No action" placeholder.

Why this matters:
- It adds noise.
- Empty action cells or a "View" action would be more useful.

Fix:
- Replace with "View" once detail drawer exists.
- Or leave the cell visually empty while preserving accessible context.

### 14. Register/login OTP development code is visible in dev UI

Evidence:
- `src/pages/LoginPage.jsx`
- `src/pages/RegisterPage.jsx:245`

Problem:
- Development OTP is shown in an alert during local dev.

Why this matters:
- Acceptable for local work, but visually it normalizes a security smell.
- The alert styling competes with real user-facing feedback.

Fix:
- Keep it behind a deliberately dev-styled surface or console-only output.
- Ensure it is impossible in production.

### 15. Customer lookup flow still depends on manual table entry as a fallback

Evidence:
- `src/components/public-order/TableLookupForm.jsx`
- `src/pages/PublicOrderPage.jsx:329`

Problem:
- The fallback asks for a "table reference" with minimal guidance.

Why this matters:
- A customer who cannot scan a QR is already in a recovery flow.
- Recovery flows need examples and staff handoff clarity.

Fix:
- Use a clearer label like "Table number".
- Add examples only if restaurant table formats are known.
- Consider a staff-facing fallback instead of customer guessing.

## Visual / HCI Problems

See `VISUAL_HCI_DEEP_ANALYSIS.md` for the full visual and interaction critique. The short version:

- The app has style, but the style often outranks usability.
- The palette is heavily beige/gold and gives the product a samey, low-contrast feel.
- Typography leans on small uppercase mono labels too often.
- The owner side looks more like a designed portfolio piece than a fast operations tool.
- The public ordering side feels elegant but slightly over-chromed for the task of choosing food.
- Icons are underused, so repeated text buttons slow scanning.
- Several scrollable navigation areas hide scrollbars, reducing discoverability.
- Cards and soft surfaces dominate the UI, making hierarchy feel decorative rather than operational.

## What Must Be Fixed Before Passing

1. Restore functional table card expansion/collapse.
2. Make report period filters real end to end.
3. Fix destructive-dialog focus defaults.
4. Replace nested public menu interactions with valid button structure.
5. Make cart review and order success proper modals.
6. Rework public category/search behavior so customers can scan and search the whole menu.
7. Add meaningful order detail/review tooling for staff.
8. Reduce visual noise: fewer cards, fewer tiny uppercase labels, more icon-supported controls, better contrast and hierarchy.

