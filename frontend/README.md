# Church Registry – Frontend

Next.js 14 (App Router) app for the Church Registry. Login and home are implemented with TDD.

## Setup

```bash
npm install
cp .env.local.example .env.local   # optional; defaults to http://localhost:8080
```

## Scripts

- `npm run dev` – start dev server (default port 3000)
- `npm run build` – production build
- `npm run start` – run production server
- `npm test` – run Jest tests

## Auth

- **Login:** `/login` – username/password; on success stores token and refresh token in `localStorage` and redirects to home.
- **Home:** `/` – protected; redirects to `/login` if not authenticated. Shows “Church Registry” and “Welcome, {displayName}”.

Ensure the backend is running (e.g. `./mvnw spring-boot:run` in the repo root) and `NEXT_PUBLIC_API_URL` points to it.
