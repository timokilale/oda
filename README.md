# ODA Mobile

QR-code restaurant ordering platform. Customers scan a QR code at their table to browse the menu and place orders. Staff manage orders, menus, tables, and reports via a dashboard.

## Tech Stack

- **Frontend**: React 19, React Router v7, Tailwind CSS v4, Motion
- **Backend**: Laravel 12, MySQL
- **Mobile**: Mobile-first responsive design

## Setup

```bash
# Frontend
npm install
npm run dev

# Backend (separate terminal)
cd backend
composer install
php artisan migrate
php artisan serve
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm test` | Run Vitest tests |
| `npm run dev:all` | Start backend + frontend |
