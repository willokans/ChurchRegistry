# Production Deployment Guide

This document describes how to deploy Church Registry to production using Fly.io and Supabase. Domain: **parishregistry.ng** — use `app.parishregistry.ng` (frontend) and `api.parishregistry.ng` (API).

---

## Overview

| Phase | Description |
|-------|-------------|
| **Pre Postgres** | Deploy prod Fly apps using **staging DB**. Verify pipeline and app behavior before launch. |
| 1 | Create production Supabase project |
| 2 | Create production Fly apps |
| 3 | GitHub workflow for production deploys |
| 4 | Custom domains |
| 5 | Environment parity and hardening |

---

## Pre Postgres Prod (Start Here)

Deploy API and frontend to prod Fly apps (`church-registry-api`, `church-registry`) using the **staging database**. This validates the deployment pipeline before production data exists.

### 1. Create Fly apps

```bash
fly apps create church-registry-api --org YOUR_ORG
fly apps create church-registry --org YOUR_ORG
```

### 2. Set GitHub Secrets for Pre Postgres

Copy staging values into the `_PROD` secrets. CORS must include prod frontend URLs.

| Secret | Pre Postgres value |
|--------|--------------------|
| `API_DATABASE_URL_PROD` | Same as `API_DATABASE_URL` (staging JDBC URL) |
| `API_DATABASE_USERNAME_PROD` | Same as `API_DATABASE_USERNAME` |
| `API_DATABASE_PASSWORD_PROD` | Same as `API_DATABASE_PASSWORD` |
| `API_JWT_SECRET_PROD` | Same as `API_JWT_SECRET` or distinct |
| `API_CORS_ALLOWED_ORIGINS_PROD` | `https://church-registry-staging.fly.dev,https://church-registry.fly.dev` (staging + prod frontend URLs) |
| `SUPABASE_SERVICE_ROLE_KEY_PROD` | Same as `SUPABASE_SERVICE_ROLE_KEY` |
| `NEXT_PUBLIC_API_URL_PROD` | `https://church-registry-api.fly.dev` |

Optional: `API_JWT_EXPIRATION_MS_PROD`, `API_JWT_REFRESH_EXPIRATION_MS_PROD`.

### 2b. GitHub Secrets (if prod apps are in a different org)

If production apps (`church-registry-api`, `church-registry`) are in a different Fly org than staging, **Fly tokens are org-scoped** — you need a token that can access the prod org:

| Secret | Value |
|--------|-------|
| `FLY_ORG_PROD` | Production org slug (run `fly orgs list` for exact value, e.g. `wyloks-166`) |
| `FLY_API_TOKEN_PROD` | Fly token with access to prod org. Options: (1) `fly auth token` for personal token (access to all orgs), or (2) `fly tokens create org -o wyloks-166` for org-scoped token |

Add in **Settings → Secrets and variables → Actions → Secrets**. The workflow uses `FLY_API_TOKEN_PROD` when set; otherwise falls back to `FLY_API_TOKEN`.

### 3. Deploy

Push to `main` or run the workflow manually. The workflow uses `fly.api.prod.toml` and `frontend/fly.prod.toml`.

---

## Phase 1: Production Supabase

**See [docs/SUPABASE_PRODUCTION_SETUP.md](docs/SUPABASE_PRODUCTION_SETUP.md)** for the full step-by-step guide.

Summary:

1. Create a new Supabase project (separate from staging)
2. Run `supabase/production-setup.sql` in the SQL Editor to create storage buckets
3. Collect credentials: JDBC URL, username, password, service role key
4. Liquibase runs automatically when the API first connects — no manual schema migration

---

## Phase 2: Production Fly Apps

### Create apps

```bash
fly apps create church-registry-api --org YOUR_ORG
fly apps create church-registry --org YOUR_ORG
```

### Production secrets (API app)

Set these on `church-registry-api`:

| Secret | Description |
|--------|-------------|
| `SPRING_DATASOURCE_URL` | Production JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | Production DB username |
| `SPRING_DATASOURCE_PASSWORD` | Production DB password |
| `JWT_SECRET` | **Distinct** from staging; min 32 bytes |
| `CORS_ALLOWED_ORIGINS` | `https://app.parishregistry.ng` (and custom domain when ready) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Supabase service role key |

Optional: `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` if storage URL inference fails.

### Production secrets (frontend app)

Set on `church-registry`:

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.parishregistry.ng` (or Fly URL before custom domain) |

---

## Phase 3: GitHub Workflow

Use `.github/workflows/deploy-production.yml` (trigger: `push` to `main`). Required GitHub Secrets:

| Secret | Description |
|--------|-------------|
| `FLY_API_TOKEN` | Same as staging |
| `API_DATABASE_URL_PROD` | Production JDBC URL |
| `API_DATABASE_USERNAME_PROD` | Production DB username |
| `API_DATABASE_PASSWORD_PROD` | Production DB password |
| `API_JWT_SECRET_PROD` | Production JWT secret (distinct from staging) |
| `API_CORS_ALLOWED_ORIGINS_PROD` | `https://app.parishregistry.ng` |
| `SUPABASE_SERVICE_ROLE_KEY_PROD` | Production Supabase service role key |
| `NEXT_PUBLIC_API_URL_PROD` | `https://api.parishregistry.ng` |

---

## Phase 4: Custom Domains

**See [docs/CUSTOM_DOMAIN_SETUP.md](docs/CUSTOM_DOMAIN_SETUP.md)** for the full step-by-step guide.

Summary:
1. Add domains in Fly: `fly certs add parishregistry.ng --app church-registry`, `fly certs add api.parishregistry.ng --app church-registry-api`
2. Add DNS records: root (A/AAAA) and `api` (CNAME) per `fly certs setup`
3. Update GitHub secrets `API_CORS_ALLOWED_ORIGINS_PROD` and `NEXT_PUBLIC_API_URL_PROD` to use custom domains
4. Redeploy

Production URLs: https://parishregistry.ng (frontend), https://api.parishregistry.ng (API)

---

## Phase 5: Hardening

- Use `application-prod.yaml` (set via `SPRING_PROFILES_ACTIVE=prod`)
- Distinct JWT secrets for staging vs production
- Consider `min_machines_running = 1` to avoid cold starts
- Optional: monitoring (Fly metrics, Sentry, UptimeRobot)
