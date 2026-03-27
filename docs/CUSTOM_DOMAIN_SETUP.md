# Custom Domain Setup: sacramentregistry.com

Production URLs:
- **Frontend:** https://sacramentregistry.com (root domain)
- **API:** https://api.sacramentregistry.com

Domain purchased from [GO54](https://app.go54.com/domain/new).

---

## Step 1: Add Domains in Fly.io

### API app (church-registry-api)

```bash
fly certs add api.sacramentregistry.com --app church-registry-api
```

Or via Fly dashboard: **church-registry-api** → **Settings** → **Domains** → **Add domain** → `api.sacramentregistry.com`

### Frontend app (church-registry)

```bash
fly certs add sacramentregistry.com --app church-registry
```

Or via Fly dashboard: **church-registry** → **Settings** → **Domains** → **Add domain** → `sacramentregistry.com`

---

## Step 2: Add DNS Records

At GO54 (or your DNS provider for sacramentregistry.com), add these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `api` | `church-registry-api.fly.dev` | 3600 |
| A | `@` | (see below) | 3600 |
| AAAA | `@` | (see below) | 3600 |

**For root domain (sacramentregistry.com):** Run `fly certs setup sacramentregistry.com --app church-registry` to get the exact A and AAAA values. (`fly certs` does not take `--org`; the app name is enough.) Some DNS providers (e.g. Cloudflare) support CNAME flattening for root—use `church-registry.fly.dev` if available.

**For api subdomain:** CNAME `api` → `church-registry-api.fly.dev`

**Note:** If GO54 uses different labels, "Name" may be `@` or blank for root; use `api` for the API subdomain.

---

## Step 3: Verify SSL Certificates

After DNS propagates (5–30 minutes):

```bash
fly certs show api.sacramentregistry.com --app church-registry-api
fly certs show sacramentregistry.com --app church-registry
```

Status should be `Ready` when certificates are issued.

---

## Step 4: Update GitHub Secrets

Update these production secrets to use the custom domain:

| Secret | New value |
|--------|-----------|
| `API_CORS_ALLOWED_ORIGINS_PROD` | `https://church-registry-staging.fly.dev,https://church-registry.fly.dev,https://sacramentregistry.com` |
| `NEXT_PUBLIC_API_URL_PROD` | `https://api.sacramentregistry.com` |

---

## Step 5: Redeploy

Push to `main` or re-run the production workflow. The deploy will use the updated secrets and config.

---

## Verification

- **Frontend:** https://sacramentregistry.com
- **API health:** https://api.sacramentregistry.com/api/health
