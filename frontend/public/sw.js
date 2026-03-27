/* eslint-disable no-restricted-globals */

const STATIC_CACHE = 'church-registry-static-v2';
const VERSIONED_CACHES = [STATIC_CACHE];

// Keep this list small. We cache create-flow documents opportunistically
// when they are successfully loaded online.
const PRECACHE_URLS = ['/', '/manifest.webmanifest'];

const CREATE_FLOW_PATHS = new Set([
  '/baptisms/new',
  '/communions/new',
  '/confirmations/new',
  '/marriages/new',
  '/holy-orders/new'
]);

function normalizePathname(pathname) {
  if (pathname === '/') return '/';
  return pathname.replace(/\/$/, '');
}

function getCacheKey(requestUrl) {
  // Cache document shell pages by pathname only (ignore query string).
  // Use pathname-only keys so precaching with '/' works consistently.
  return normalizePathname(requestUrl.pathname);
}

function isSameOrigin(requestUrl) {
  return requestUrl.origin === self.location.origin;
}

function shouldBypass(requestUrl) {
  // Never cache API responses (sensitive + always must be fresh for correctness).
  return requestUrl.pathname.startsWith('/api/');
}

function shouldCacheAsset(requestUrl) {
  // Cache static assets for the app shell.
  return (
    requestUrl.pathname.startsWith('/_next/static/') ||
    requestUrl.pathname.startsWith('/icons/') ||
    requestUrl.pathname.startsWith('/images/') ||
    requestUrl.pathname === '/favicon.ico' ||
    requestUrl.pathname === '/manifest.webmanifest'
  );
}

function shouldCacheDocument(requestUrl, request) {
  if (request.mode !== 'navigate') return false;

  // Allow offline access to the key create flows and root.
  const normalized = normalizePathname(requestUrl.pathname);
  if (normalized === '/') return true;
  return CREATE_FLOW_PATHS.has(normalized);
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const requestUrl = new URL(request.url);
  const cacheKey = getCacheKey(requestUrl);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(cacheKey, response.clone());
      return response;
    }
  } catch (err) {
    // ignored; we'll try cache below
  }

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Final fallback: root app shell.
  return cache.match('/') || Response.error();
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);

      await Promise.all(
        PRECACHE_URLS.map(async (path) => {
          try {
            const response = await fetch(path, { cache: 'no-store' });
            if (response && response.ok) {
              cache.put(path, response.clone());
            }
          } catch {
            // Best-effort only; don't fail installation.
          }
        })
      );

      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (!VERSIONED_CACHES.includes(key)) return caches.delete(key);
          return undefined;
        })
      );
      self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);

  if (!isSameOrigin(requestUrl)) return;
  if (shouldBypass(requestUrl)) return;

  // Assets: cache-first.
  if (shouldCacheAsset(requestUrl)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Documents: network-first with offline fallback.
  if (shouldCacheDocument(requestUrl, request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Everything else: network-only.
});

