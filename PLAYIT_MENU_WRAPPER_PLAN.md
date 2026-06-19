# Playit — Menu Wrapper Plan

## Concept

Restaurants keep their existing menu website and QR codes. Oda wraps/embeds their menu inside its own page and overlays interactive actions (order, song request, call waiter). The restaurant never rebuilds their menu — they just give us a URL.

## Customer Flow

```
Customer scans Oda QR on table
  │
  ▼
Oda page loads (oda.xyz/r/{restaurant})
  │
  ├── Iframe: restaurant's menu page renders
  │   (or fallback: proxy-fetched content)
  │
  ├── Floating bottom bar (always visible)
  │   ├── 🍔 Order — opens Oda order drawer
  │   ├── 🎵 Request — opens song request modal
  │   └── 🔔 Call Waiter — sends alert to staff
  │
  └── All actions hit Oda's backend
```

## Implementation Paths

### 1. Iframe (primary)

Oda's page embeds `blueocean.restaurant/menu` in an `<iframe>`. Oda's action bar floats over it.

**Pro:** Trivial to implement, restaurant's menu stays live (updates automatically), zero backend work.
**Con:** Some sites block iframes via `X-Frame-Options` or `Content-Security-Policy`. JS-heavy SPAs may misbehave in frames.

### 2. Server-side proxy (fallback)

Oda's backend fetches the restaurant's menu HTML, inlines CSS, rewrites relative URLs, injects Oda's assets, and serves it as a full page.

**Pro:** Works on any site regardless of frame-blocking headers. Full control over the DOM.
**Con:** Significantly more backend work. Dynamic JS menus (React/Vue SPAs) are very hard to proxy faithfully. Cache invalidation is non-trivial.

### 3. New tab + overlay (last resort)

If both iframe and proxy fail, open the restaurant's menu in a new browser tab with Oda's action bar as a pinned popup window.

## Detection Flow

```
Restaurant registers menu URL
  │
  ▼
Backend checks URL:
  ├── Fetches headers (X-Frame-Options, CSP)
  ├── Attempts iframe render test
  │
  ├── If iframe allowed → serve iframe wrapper
  ├── If iframe blocked → serve proxy wrapper
  └── If proxy fails → fallback to new tab
```

## Backend Scope

### New Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/restaurants/{id}/menu-url` | Save the restaurant's external menu URL |
| GET | `/public/r/{ref}` | Wrapper page — serves the iframe/proxy + Oda overlay |
| GET | `/public/r/{ref}/proxy` | Proxy fetcher — returns the proxied menu HTML |

### Database

Add `menu_wrapper_url` column to `restaurants` table (nullable). If null, use Oda's native menu builder (existing behavior). If set, the public customer page wraps that URL.

## Frontend Scope

### New Component: `MenuWrapper`

- Receives `menuUrl` prop
- Tries iframe render first
- Detects iframe load failure (blank content, error event)
- Falls back to proxy or new tab
- Renders the floating action bar overlay

### Action Bar Components

- `OrderDrawer` — Existing order UI (reuse from `public-order/`)
- `SongRequestModal` — New: song name/artist input, optional priority payment
- `CallWaiterButton` — Triggers notification to staff dashboard

## Song Request Feature (Playit)

### Customer Side

Modal with:
- Song title + artist input
- Optional priority payment slider (e.g., $1–$10)
- Submit button

### Staff/DJ Side

Dashboard panel showing:
- Real-time request queue (ordered by priority if paid)
- Song title, table number, time ago
- Mark as "played" / dismiss

### Revenue Model

- Priority fee goes to venue (minus Oda's cut)
- Optional: free requests with 2-song limit per table per hour

## Onboarding Flow for Restaurants

```
1. Restaurant signs up on Oda
2. Adds their external menu URL
3. Oda generates QR codes for their tables (oda.xyz/r/{ref})
4. Restaurant prints new QR stickers or updates their existing QR redirect
5. Done — no menu migration, no redesign
```

## Why This Works

- **Zero friction for restaurants** — keep their site, their design, their hosting
- **Delightful surprise for customers** — familiar menu + unexpected interactivity
- **Revenue without demanding commitment** — try Oda with one QR sticker
- **Migration path** — once they see value, they may adopt Oda's native menu

## Future Iterations

- Inline action buttons within the iframe/proxy content (detect menu items and inject "Add to order" buttons)
- QR-less entry — NFC tags, direct URL sharing
- Multi-language menu overlay
- AI-powered menu item recommendations
