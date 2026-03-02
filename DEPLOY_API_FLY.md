# Deploy Spring API on Fly.io

This repository now includes a dedicated Fly.io deployment path for the Spring Boot API.

## Files

- `fly.api.toml` - Fly app/process/service and health checks.
- `Dockerfile` - backend container build for Spring Boot.
- `.github/workflows/deploy-staging.yml` - coordinated staging pipeline (API deploy first, frontend deploy second).

## Required GitHub configuration

### Repository Secrets

- `FLY_API_TOKEN`
- `API_DATABASE_URL`
- `API_DATABASE_USERNAME`
- `API_DATABASE_PASSWORD`
- `API_JWT_SECRET` (minimum 32 bytes)
- `API_CORS_ALLOWED_ORIGINS` (comma-separated)
- `API_JWT_EXPIRATION_MS` (optional)
- `API_JWT_REFRESH_EXPIRATION_MS` (optional)

### Repository Variables

- `FLY_API_APP_NAME` (optional, defaults to `church-registry-api-staging`)
- `FLY_FRONTEND_APP_NAME` (optional, defaults to `church-registry-staging`)
- `FLY_ORG` (optional, Fly organization slug used if workflow needs to create the API app)

## Runtime behavior

- Spring runs with `SPRING_PROFILES_ACTIVE=prod`.
- Fly health checks use `GET /api/health`.
- Secrets are synchronized on each staging deploy.
- A push to `staging` triggers one workflow where frontend deployment runs only after successful API deployment.
