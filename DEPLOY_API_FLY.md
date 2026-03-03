# Deploy Spring API on Fly.io

This repository now includes a dedicated Fly.io deployment path for the Spring Boot API.

## Files

- `fly.api.toml` - Fly app/process/service and health checks.
- `Dockerfile` - backend container build for Spring Boot.
- `.github/workflows/deploy-staging.yml` - coordinated staging pipeline (API deploy first, frontend deploy second).

## Required GitHub configuration

### Repository Secrets

- `FLY_API_TOKEN`
- `API_DATABASE_URL` — full JDBC URL, e.g. `jdbc:postgresql://aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&preferQueryMode=simple&prepareThreshold=0`
- `API_DATABASE_USERNAME`
- `API_DATABASE_PASSWORD`
- `API_JWT_SECRET` (minimum 32 bytes)
- `API_CORS_ALLOWED_ORIGINS` (comma-separated)
- `API_JWT_EXPIRATION_MS` (optional)
- `API_JWT_REFRESH_EXPIRATION_MS` (optional)
- `SUPABASE_SERVICE_ROLE_KEY` — required for certificate uploads and downloads (Holy Communion, Baptism from another parish). Get from Supabase Dashboard → Project Settings → API. Add to GitHub Secrets; the deploy workflow syncs it to Fly.

### Repository Variables

- `FLY_API_APP_NAME` (optional, defaults to `church-registry-api-staging`)
- `FLY_FRONTEND_APP_NAME` (optional, defaults to `church-registry-staging`)
- `FLY_ORG` (optional, Fly organization slug used if workflow needs to create the API app)

## Troubleshooting

If the deploy fails with "app is not listening" or health check timeout:

1. **Check startup logs:** `fly logs --app church-registry-api-staging` — look for Liquibase errors, DB connection failures, or OOM.
2. **Supabase pooler:** Ensure `API_DATABASE_URL` includes `?preferQueryMode=simple&prepareThreshold=0` (prod config sets these via Hikari; URL params also work).
3. **First deploy:** Liquibase can take 2–3 minutes; health check grace period is 300s.

## Runtime behavior

- Spring runs with `SPRING_PROFILES_ACTIVE=prod`.
- Fly health checks use `GET /api/health`.
- Secrets are synchronized on each staging deploy.
- A push to `staging` triggers one workflow where frontend deployment runs only after successful API deployment.
