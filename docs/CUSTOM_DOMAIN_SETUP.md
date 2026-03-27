# Custom Domain Setup: parishregistry.ng

Production URLs:
- **Frontend:** https://parishregistry.ng (root domain)
- **API:** https://api.parishregistry.ng

Domain purchased from [GO54](https://app.go54.com/domain/new).

---

## Step 1: Add Domains in Fly.io

### API app (church-registry-api)

```bash
fly certs add api.parishregistry.ng --app church-registry-api --org wyloks-166
```

Or via Fly dashboard: **church-registry-api** → **Settings** → **Domains** → **Add domain** → `api.parishregistry.ng`

### Frontend app (church-registry)

```bash
fly certs add parishregistry.ng --app church-registry --org wyloks-166
```

Or via Fly dashboard: **church-registry** → **Settings** → **Domains** → **Add domain** → `parishregistry.ng`

---

## Step 2: Add DNS Records

At GO54 (or your DNS provider for parishregistry.ng), add these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `api` | `church-registry-api.fly.dev` | 3600 |
| A | `@` | (see below) | 3600 |
| AAAA | `@` | (see below) | 3600 |

**For root domain (parishregistry.ng):** Run `fly certs setup parishregistry.ng --app church-registry --org wyloks-166` to get the exact A and AAAA values. Some DNS providers (e.g. Cloudflare) support CNAME flattening for root—use `church-registry.fly.dev` if available.

**For api subdomain:** CNAME `api` → `church-registry-api.fly.dev`

**Note:** If GO54 uses different labels, "Name" may be `@` or blank for root; use `api` for the API subdomain.

---

## Step 3: Verify SSL Certificates

After DNS propagates (5–30 minutes):

```bash
fly certs show api.parishregistry.ng --app church-registry-api --org wyloks-166
fly certs show parishregistry.ng --app church-registry --org wyloks-166
```

Status should be `Ready` when certificates are issued.

---

## Step 4: Update GitHub Secrets

Update these production secrets to use the custom domain:

| Secret | New value |
|--------|-----------|
| `API_CORS_ALLOWED_ORIGINS_PROD` | `https://church-registry-staging.fly.dev,https://church-registry.fly.dev,https://parishregistry.ng` |
| `NEXT_PUBLIC_API_URL_PROD` | `https://api.parishregistry.ng` |

---

## Step 5: Redeploy

Push to `main` or re-run the production workflow. The deploy will use the updated secrets and config.

---

## Verification

- **Frontend:** https://parishregistry.ng
- **API health:** https://api.parishregistry.ng/api/health
