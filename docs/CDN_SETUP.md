# CDN Setup for Frontend Static Assets

This document describes how to add CDN caching for the Sacrament Registry frontend to improve load times for low-bandwidth users (e.g. Nigeria). **Only enable when static asset size justifies**—typically when `_next/static` bundle is large enough that edge caching materially reduces latency.

## What's Already Configured

### Cache headers (next.config.js)

- **`/_next/static/*`**: Next.js sets `Cache-Control: public, max-age=31536000, immutable` by default. These assets have content hashes in filenames, so they are safe to cache indefinitely.
- **`/api/*`**: We set `Cache-Control: no-store, no-cache, must-revalidate, private` so CDNs and browsers never cache API responses. This ensures auth, health checks, and any proxied routes bypass cache.

## Option A: Cloudflare (recommended)

Cloudflare provides a free CDN in front of your Fly.io app. It respects origin `Cache-Control` headers, so no extra rules are required for correct behavior.

### Steps

1. **Add your site to Cloudflare**
   - Sign up at [cloudflare.com](https://www.cloudflare.com)
   - Add site: `church-registry-staging.fly.dev` (or your custom domain)
   - Update your domain's nameservers to Cloudflare's (or use CNAME for subdomain)

2. **Proxy traffic through Cloudflare**
   - In DNS, create a CNAME: `church-registry-staging` → `church-registry-staging.fly.dev` (or your Fly app hostname)
   - Ensure the proxy status is **Proxied** (orange cloud)

3. **Cache behavior**
   - **`/_next/static/*`**: Cloudflare caches based on origin `Cache-Control: public, max-age=31536000, immutable`
   - **`/api/*`**: Cloudflare does not cache because origin sends `Cache-Control: no-store`
   - **HTML pages** (`/`, `/login`, etc.): Short or no cache by default; fine for dynamic content

4. **(Optional) Explicit bypass rule for `/api/*`**
   - If you want to guarantee API bypass regardless of origin headers:
   - **Caching** → **Cache Rules** → Create rule
   - **When**: `(http.request.uri.path contains "/api/")`
   - **Then**: Bypass cache

### Custom domain

If you use a custom domain (e.g. `registry.yourchurch.org`), point it to your Fly app and add it to Cloudflare. API calls from the frontend go to `NEXT_PUBLIC_API_URL` (the Spring Boot backend), so they bypass the frontend CDN entirely.

## Option B: Fly.io only (no CDN)

Fly.io does not provide a built-in edge CDN for static assets. The app runs in a single region (e.g. `jnb` for Johannesburg). The cache headers we set still help:

- **Browsers** cache `_next/static` for 1 year
- **`/api/*`** is never cached by browsers

For multi-region edge caching, use Cloudflare (Option A).

## Security

- **Parish filtering**: All API calls go to the Spring Boot backend (`NEXT_PUBLIC_API_URL`). The frontend CDN only caches static assets and HTML; no sacrament data is cached.
- **Auth**: Login and token refresh hit the backend directly. The frontend's `/api/*` routes (health, auth proxy) are not cached.
