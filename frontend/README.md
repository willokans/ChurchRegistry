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

## Deploy to Fly.io (staging)

From the `frontend/` directory:

1. Install [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) and log in: `fly auth login`.
2. Create the app (once): `fly apps create church-registry-staging`.
3. Set Supabase secrets (use your staging project URL and service_role key):
   ```bash
   fly secrets set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
4. Deploy: `fly deploy`.

The app will be at `https://church-registry-staging.fly.dev` (or the URL shown after deploy).

**Auto-deploy:** Pushing to the `staging` branch runs the GitHub Action that lints, tests, and deploys to Fly staging. Add `FLY_API_TOKEN` (from [Fly.io tokens](https://fly.io/user/tokens)) in the repo’s **Settings → Secrets and variables → Actions**.
