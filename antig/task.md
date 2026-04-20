# Task Tracker — UI/UX Review Fix-All

## Phase 1: Critical Bugs & Safety Fixes
- [ ] OWN-L06: Fix React Rules of Hooks in LoginPage.jsx
- [ ] OWN-L06: Fix React Rules of Hooks in RegisterPage.jsx
- [ ] OWN-L05: Enforce inactive restaurant in publicRoutes.js
- [ ] OWN-U02: Guard dev OTP in LoginPage.jsx
- [ ] OWN-U02: Guard dev OTP in RegisterPage.jsx
- [ ] CUS-L02: Add rate limiting to public order endpoint
- [ ] A11Y-05: Replace raw CSS injection in PublicOrderPage.jsx
- [ ] A11Y-05: Scope template-order.css under .order-page

## Phase 2: Design System Foundation
- [ ] Add design tokens to template-workspace.css (:root)
- [ ] Add DM Sans to index.html, trim Cormorant weights
- [ ] Change body font from mono to sans-serif
- [ ] Add button variants (ghost, secondary)
- [ ] Add status pill color variants
- [ ] Fix empty state dashed borders
- [ ] Fix muted text contrast (A11Y-02)
- [ ] Consolidate radius and letter-spacing tokens
- [ ] Fix italic overuse (TYP-02)
- [ ] Consolidate line-height values (TYP-01)
- [ ] Apply token consolidation to template-order.css

## Phase 3: Shared Component Infrastructure
- [ ] Create LoadingSkeleton.jsx + CSS
- [ ] Replace all "Loading..." text with skeletons
- [ ] Add flash message entry/exit animations
- [ ] Create ConfirmDialog.jsx + CSS
- [ ] Create usePageTitle.js hook
- [ ] Add page titles to all pages
- [ ] Add skip-to-content link
- [ ] Create SegmentedControl.jsx (fix ARIA)
- [ ] Fix status pill semantic roles (A11Y-03)
- [ ] Create NotFoundPage.jsx (IA-04)
- [ ] Fix duplicate public order URL (IA-03)
- [ ] Fix brand consistency (IA-01)
- [ ] Create RestaurantsContext.jsx (PERF-03)

## Phase 4: Owner Page Fixes
- [ ] Restructure topbar (OWN-V06, RES-01, OWN-U03)
- [ ] Fix QuickCreateRestaurant popover (OWN-V07)
- [ ] Fix nav scroll indicator (RES-02)
- [ ] Fix Tables page inline style (OWN-V09)
- [ ] Improve Reports page metrics (OWN-V10)
- [ ] Reverse menu page layout (OWN-V11)
- [ ] Add menu item delete for archived items (OWN-L02)
- [ ] Add order detail view (OWN-L04)
- [ ] Add city/country validation hints (OWN-L08)
- [ ] Add currency per restaurant (OWN-L09)
- [ ] Add menu item sort order (OWN-L10)
- [ ] Add category separator hint (OWN-L11)
- [ ] Add reports date filtering (OWN-L12)
- [ ] Add order table number filter (OWN-L13)
- [ ] Add order polling (OWN-L14)
- [ ] Fix OTP resend redundancy (OWN-U01)
- [ ] Remove duplicate "New item" button (OWN-U04)
- [ ] Fix image hint text (OWN-U05)
- [ ] Improve restaurant limit message (OWN-U06)
- [ ] Improve table deletion warning (OWN-U08)
- [ ] Replace settings filler panel (OWN-U09)
- [ ] Add account info dropdown (OWN-L07)

## Phase 5: Customer Page Fixes
- [ ] Improve item fallback visual (CUS-V01)
- [ ] Fix "No description yet." text (CUS-V02)
- [ ] Fix duplicate search icon (CUS-V03)
- [ ] Fix cart strip mobile height (CUS-V04)
- [ ] Differentiate cart review vs success dialog (CUS-V05)
- [ ] Add order tracking with polling (CUS-L01)
- [ ] Add customer order cancellation (CUS-L03)
- [ ] Lower quantity cap + warning (CUS-L04)
- [ ] Improve table lookup help (CUS-L05)
- [ ] Fix search button layout stability (CUS-L06)
- [ ] Add error recovery for failed loads (CUS-L07)
- [ ] Add cart persistence via sessionStorage (CUS-L08)
- [ ] Require cart review before placing order (CUS-L09)
- [ ] Add quick-add button on cards (CUS-U01)
- [ ] Add quantity badge on collapsed cards (CUS-U02)
- [ ] Add haptic/visual feedback on qty change (CUS-U03)
- [ ] Add cart strip tap affordance (CUS-U04)
- [ ] Improve order number prominence (CUS-U05)
- [ ] Add Escape key for dialogs (A11Y-06)

## Phase 6: Performance & Responsive Polish
- [ ] Optimize font loading (PERF-01)
- [ ] Smooth table-to-card transition (RES-03)
- [ ] Add max-width on customer menu (RES-04)
