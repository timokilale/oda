# ODA Mobile

This folder now holds the React + Vite migration for the restaurant workspace. The old FastAPI + SQLite app still exists at the repo root as legacy reference, but the new implementation in `odamobile` is designed to replace it with:

- React + Vite for the owner and customer UI
- Express for the API layer
- MySQL for persistence
- Cookie-based owner auth, uploads, QR-code generation, and restaurant workflow APIs in one server

## Included flows

- Owner registration and login
- Owner restaurant dashboard
- Multi-restaurant access rule enforcement
- Menu creation, listing, and safe removal with image uploads
- Table QR creation and deletion
- Customer ordering via public table links
- Owner order status updates
- Restaurant reporting
- Basic admin data endpoints for restaurant and menu templates

## Project structure

```text
odamobile/
  server/
    src/
      config.js
      db.js
      http/
      routes/
      services/
      index.js
      repository.js
      schema.js
      utils.js
  src/
    components/
    context/
    lib/
    pages/
    test/
  index.html
  vite.config.js
```

## Environment

Copy `.env.example` to `.env` and set the MySQL connection values.

Important:

- `PUBLIC_APP_URL` should point to the frontend URL that diners will open from QR codes.
- In local development, if you run Vite on `http://localhost:5173`, keep `PUBLIC_APP_URL=http://localhost:5173`.
- The API server defaults to `http://localhost:4000`.

## Scripts

- `npm run dev`: start the Vite frontend
- `npm run server`: start the Express API with file watching
- `npm run build`: create the Vite production build in `dist`
- `npm run test`: run both backend and frontend automated tests
- `npm run test:frontend`: run frontend smoke tests with Vitest + Testing Library
- `npm run test:server`: run backend regression tests against the MySQL test database
- `npm run preview`: preview the built frontend
- `npm start`: run the Express server without watch mode

## Local setup

1. Install dependencies with `npm install`
2. Make sure MySQL is running
3. Create `.env` from `.env.example`
4. Start the backend: `npm run server`
5. Start the frontend in another terminal: `npm run dev`

## Testing

- The backend test suite uses Node's built-in test runner and creates/uses `MYSQL_DATABASE` from the active environment.
- To avoid destroying development data, point tests at a dedicated database such as `oda_cloud_test`.
- The frontend smoke suite uses Vitest, jsdom, and Testing Library to cover critical owner and public-order flows.
- Example: set `MYSQL_DATABASE=oda_cloud_test` in a test-specific environment and run `npm run test` or `npm run test:server`.

The server creates the MySQL database and tables automatically on startup if the configured MySQL user can create databases.

## Notes

- Uploads are written to `server/uploads/`
- The Vite dev server proxies `/api` and `/uploads` to the backend
- When a production `dist/` build exists, the Express server will serve the SPA directly
- Legacy table tokens such as `restaurant-1-1` are still accepted when placing customer orders
