# State Management Review

## Scope
This review covers the owner workspace flow, which is where the state model was doing the most damage:

- `src/pages/RestaurantLayout.jsx`
- `src/components/WorkspaceShell.jsx`
- `src/pages/OrdersPage.jsx`
- `src/pages/MenuPage.jsx`
- `src/pages/MenuCreatePage.jsx`
- `src/pages/TablesPage.jsx`
- `src/pages/TablesCreatePage.jsx`
- `src/pages/ReportsPage.jsx`

## Flaws

### 1. The app built a fake router on top of React Router
`src/App.jsx` already declared nested restaurant routes. `src/pages/RestaurantLayout.jsx` ignored them and re-implemented route resolution by hand from `location.pathname`.

Impact:

- two routing systems existed at once
- route state and page state became harder to reason about
- child routes were effectively dead declarations
- page lifecycle stopped matching screen lifecycle

### 2. Hidden tabs stayed mounted forever
The layout kept multiple restaurant pages mounted inside hidden panels. That means inactive screens kept their local state, open dialogs, and effects.

Impact:

- off-screen pages could keep polling or fetching
- dialog state could survive navigation when it should have died with the page
- stale form state leaked across tab changes
- pages needed special guards like `activeViewKey` just to avoid self-inflicted bugs

### 3. Scroll was broken because layout state was fighting the browser
The tab shell forced `overflow: hidden` and then tried to fake scrolling back with panel refs and wheel interception.

Impact:

- `/restaurants/:id/menu` and sibling tabs could stop scrolling normally
- input, modal, and nested-scroll behavior became fragile
- layout bugs had to be "fixed" with more layout bugs

### 4. Flash ownership was split across layout and child pages
Transient feedback moved through `location.state.flash`, but multiple pages also consumed and cleared that state themselves.

Impact:

- duplicated flash handoff logic
- inconsistent clear timing
- harder-to-follow feedback lifecycle

### 5. Restaurant shell duplicated remote state ownership
`src/components/WorkspaceShell.jsx` fetched `/restaurants` for the switcher, while `src/hooks/useResolvedCanAddRestaurant.js` could fetch the same endpoint again just to derive add capability.

Impact:

- duplicate requests for the same data
- redundant state owners for one backend response
- unnecessary synchronization logic after restaurant creation

### 6. Async page state was coupled to the tab hack
Menu and tables pages had to know whether they were the "active" mounted tab before loading. That is backwards. A page should load because it is rendered, not because a separate visibility flag says it is allowed to exist.

Impact:

- local page logic was shaped around layout damage
- async behavior became indirect and brittle

## Fixes Implemented

### Routing and lifecycle

- `src/pages/RestaurantLayout.jsx` now uses React Router's `Outlet`.
- Restaurant pages now mount only when their route is active.
- Hidden panel state, panel refs, and wheel-capture scroll handling were removed.

### Shared workspace state

- `RestaurantLayout` still owns shared restaurant/workspace summary state, but it no longer owns fake tab state.
- Navigation flash handoff now happens once in the layout instead of being repeated in child pages.
- The workspace scroll helper now uses the real viewport instead of a hidden custom scroll container.

### Shell state

- `src/components/WorkspaceShell.jsx` now refreshes restaurant list and add-capability from one fetch path.
- The duplicate `useResolvedCanAddRestaurant` abstraction was removed.

### Page cleanup

- `src/pages/MenuPage.jsx` and `src/pages/TablesPage.jsx` now behave like normal routed pages again.
- Their fetch logic no longer depends on `activeViewKey`.
- The restaurant tabs now scroll normally because they are no longer trapped inside a fake tab viewport.

## Remaining Debt
The project is in a better state, not a finished one.

- `OrdersPage`, `ReportsPage`, and `DashboardPage` still use ad hoc local async state instead of a shared query/cache layer.
- There is still manual invalidation via `refreshWorkspace()` rather than centralized data ownership.
- The auth pages and public ordering flow still manage flash/timers locally.
- There is still no consistent abort/cancellation pattern for in-flight requests across the whole app.

That remaining debt is survivable. The fake tab router was not. That was the part actively making the UI worse.
