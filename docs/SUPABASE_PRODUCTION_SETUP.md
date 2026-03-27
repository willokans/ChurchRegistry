# Production Supabase Project Setup

This guide walks through creating and configuring a new Supabase project for production. Use a **separate project** from staging so production and staging data are isolated.

## Prerequisites

- Supabase account ([supabase.com](https://supabase.com))
- Domain: `parishregistry.ng` (use `app.parishregistry.ng` and `api.parishregistry.ng`)

---

## Phase 1: Create the Supabase Project

### Step 1: Create a new project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose your organization (or create one)
4. Fill in:
   - **Name:** `church-registry-production` (or `parish-registry-prod`)
   - **Database Password:** Generate a strong password and **save it securely**
   - **Region:** Choose closest to your users (e.g. `eu-west-1` for Nigeria)
5. Click **Create new project**
6. Wait for the project to finish provisioning (~2 minutes)

### Step 2: Get connection details

1. Go to **Project Settings** → **Database**
2. Under **Connection string**, select **URI** and copy the **Transaction** (pooler) URL
3. Convert to JDBC format:
   ```
   jdbc:postgresql://<host>:6543/postgres?sslmode=require&preferQueryMode=simple&prepareThreshold=0
   ```
   - Host is typically `aws-0-<region>.pooler.supabase.com` or similar
   - Port **6543** is the pooler (use this for the API)
4. Note the **Database password** (same as you set in Step 1)
5. Under **Connection string** → **Session mode**, note the **User** (e.g. `postgres.xxxxxxxxxxxx`)

### Step 3: Get API keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (e.g. `https://xxxxxxxxxxxx.supabase.co`)
   - **service_role** key (secret; used for certificate uploads/downloads)
   - **anon** key (optional; API uses service_role for storage)

### Step 4: Run storage bucket setup

1. Go to **SQL Editor**
2. Open `supabase/production-setup.sql` from this repo
3. Paste the contents and click **Run**
4. Verify: **Storage** → **Buckets** — you should see:
   - `baptism-certificates`
   - `communion-certificates`
   - `marriage-certificates`

---

## Phase 2: Database Schema (Liquibase)

The Spring Boot API runs **Liquibase** on startup. When the API first connects to the production database, it will:

1. Create all tables (baptism, first_holy_communion, confirmation, marriage, diocese, parish, app_users, etc.)
2. Apply RLS (Row Level Security) with `app_rls_parish_ids()` and `app_rls_is_admin()`
3. Run seed migrations (e.g. super admin)

**You do not need to run schema migrations manually.** Deploy the API with the production JDBC URL; Liquibase will run automatically. Allow 2–3 minutes on first deploy for migrations to complete.

---

## Phase 3: Credentials Checklist

Collect these for production deployment (GitHub Secrets or Fly secrets):

| Variable | Source | Example |
|----------|--------|---------|
| `API_DATABASE_URL_PROD` | Project Settings → Database → Connection string (Transaction) | `jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&preferQueryMode=simple&prepareThreshold=0` |
| `API_DATABASE_USERNAME_PROD` | Connection string → User | `postgres.xxxxxxxxxxxx` |
| `API_DATABASE_PASSWORD_PROD` | Database password from Step 1 | (your password) |
| `SUPABASE_SERVICE_ROLE_KEY_PROD` | Project Settings → API → service_role | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_URL_PROD` (optional) | Same as Project URL | Explicit `SUPABASE_URL` for the Spring API if you do not rely on inference from the JDBC username |
| `NEXT_PUBLIC_SUPABASE_URL_PROD` | Same as Project URL | Required for production **frontend** Fly app (Next.js login and API routes use this + the service role key) |

Use **distinct** JWT secrets and passwords for production vs staging.

---

## Phase 4: Connect GitHub Actions and redeploy

After the buckets exist and you have the values above:

1. Update the GitHub secrets listed in [DEPLOY_PRODUCTION.md](../DEPLOY_PRODUCTION.md) (Post Postgres cutover table), especially `NEXT_PUBLIC_SUPABASE_URL_PROD` so it points at **this** production project (not staging).
2. Push to `main` or run the **Deploy to Production** workflow. It applies Fly secrets and deploys the API and frontend.

See **Post Postgres: cutover to production database** in [DEPLOY_PRODUCTION.md](../DEPLOY_PRODUCTION.md) for the full ordered checklist.

---

## Phase 5: Verify Setup

1. **Storage buckets:** Storage → Buckets — all three certificate buckets exist
2. **First API deploy:** Deploy API with prod credentials; check Fly logs for Liquibase success
3. **Health check:** `GET https://api.parishregistry.ng/api/health` returns 200
4. **Frontend:** Sign in works (requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on the frontend app for the same project)

---

## Security Notes

- **RLS:** `app_rls_parish_ids()` and `app_rls_is_admin()` are created by Liquibase. The API sets `app.parish_ids` and `app.is_admin` per request for tenant isolation.
- **Storage:** Buckets are private. Certificate access goes through the Spring API using the service role key; anon/authenticated users cannot access storage directly.
- **Secrets:** Never commit production credentials. Use GitHub Secrets or Fly secrets.
