'use client';

import { useEffect, useMemo, useState } from 'react';
import { subscribeToOfflineQueueItemUpdates } from '@/lib/offline/queue';
import { estimateOfflineStorageUsage, formatBytes, isNearOfflineStorageCap, OFFLINE_STORAGE_WARNING_RATIO } from '@/lib/offline/storageHygiene';
import { pruneOfflineResources } from '@/lib/offline/replay';

const DISMISS_UNTIL_KEY = 'church_registry_offline_storage_hygiene_dismissed_until';
const DISMISS_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function OfflineStorageHygieneBanner() {
  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

  const [estimate, setEstimate] = useState<Awaited<ReturnType<typeof estimateOfflineStorageUsage>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number>(0);

  const nearCap = useMemo(() => {
    if (!estimate) return false;
    return isNearOfflineStorageCap(estimate);
  }, [estimate]);

  useEffect(() => {
    if (isTestEnv) return;
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(DISMISS_UNTIL_KEY);
    const until = raw ? Number(raw) : 0;
    if (Number.isFinite(until)) setDismissedUntil(until);
  }, []);

  useEffect(() => {
    if (isTestEnv) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let refreshTimer: number | null = null;

    async function refresh() {
      const next = await estimateOfflineStorageUsage();
      if (cancelled) return;
      setEstimate(next);
    }

    function scheduleRefresh() {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        void refresh();
      }, 1500);
    }

    void refresh();

    // Opportunistic cleanup on app start so we can free orphaned resources over time.
    void (async () => {
      try {
        await pruneOfflineResources();
      } catch {
        // Best-effort only.
      }
      if (cancelled) return;
      await refresh();
    })();

    const unsubscribe = subscribeToOfflineQueueItemUpdates(() => {
      scheduleRefresh();
    });

    return () => {
      cancelled = true;
      if (refreshTimer) window.clearTimeout(refreshTimer);
      unsubscribe();
    };
  }, []);

  async function handleFreeSpace() {
    if (busy) return;
    setBusy(true);
    try {
      await pruneOfflineResources({ force: true });
      setDismissedUntil(0);
      setEstimate(await estimateOfflineStorageUsage());
    } finally {
      setBusy(false);
    }
  }

  if (!estimate || !nearCap) return null;
  if (dismissedUntil && dismissedUntil > Date.now()) return null;

  const usedAttachment = formatBytes(estimate.blobsBytes);
  const capAttachment = formatBytes(estimate.maxBytes);

  const thresholdPct = Math.round(OFFLINE_STORAGE_WARNING_RATIO * 100);
  const currentPct = estimate.maxBytes ? Math.round((estimate.blobsBytes / estimate.maxBytes) * 100) : 0;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            Offline storage is getting full
          </p>
          <p className="text-xs text-amber-800 mt-0.5">
            Stored attachments: {usedAttachment} of {capAttachment}. (Warning at {thresholdPct}%, currently {currentPct}%)
          </p>
          {estimate.failedQueueCount > 0 ? (
            <p className="text-xs text-amber-700 mt-1">
              {estimate.failedQueueCount} failed submission{estimate.failedQueueCount === 1 ? '' : 's'} can be pruned when stale.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleFreeSpace()}
            disabled={busy}
            className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Freeing…' : 'Free up offline space'}
          </button>
          <button
            type="button"
            aria-label="Dismiss storage warning"
            onClick={() => {
              const until = Date.now() + DISMISS_MS;
              localStorage.setItem(DISMISS_UNTIL_KEY, String(until));
              setDismissedUntil(until);
            }}
            className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 hover:bg-amber-100"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

