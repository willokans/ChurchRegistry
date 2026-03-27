'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker.
 *
 * Note: The service worker is intentionally simple (app-shell + static assets only)
 * to avoid caching sensitive API responses.
 */
export function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // In development, unregister any SW so /_next/static chunks are never served from
    // a stale Cache Storage entry (would mismatch fresh SSR HTML and cause hydration errors).
    if (process.env.NODE_ENV === 'development') {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) void r.unregister();
      });
      return;
    }

    // Service workers require secure contexts; allow localhost during dev.
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]';
    const isSecureContext = window.isSecureContext || isLocalhost;
    if (!isSecureContext) return;

    let isCancelled = false;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        if (isCancelled) return;

        // If a new service worker takes control, reload so cached assets + UI are consistent.
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

        void registration;
      } catch (err) {
        // Non-fatal: PWA is best-effort and should not break the app.
        // eslint-disable-next-line no-console
        console.warn('Service worker registration failed:', err);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  return null;
}

