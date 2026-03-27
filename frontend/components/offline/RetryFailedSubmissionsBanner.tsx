'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNetworkStatus } from '@/lib/offline/network';
import type { OfflineQueueItem } from '@/lib/offline/queue';
import { listOfflineQueueItems, subscribeToOfflineQueueItemUpdates } from '@/lib/offline/queue';
import { retryOfflineQueueItem } from '@/lib/offline/replay';

export default function RetryFailedSubmissionsBanner() {
  const { isOnline } = useNetworkStatus();
  const [failedItems, setFailedItems] = useState<OfflineQueueItem[]>([]);
  const [retryingAll, setRetryingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listOfflineQueueItems({ status: 'failed' })
      .then((items) => {
        if (cancelled) return;
        setFailedItems(items);
      })
      .catch(() => {
        // Best-effort UI only.
        if (cancelled) return;
        setFailedItems([]);
      });

    const unsubscribe = subscribeToOfflineQueueItemUpdates((updated) => {
      setFailedItems((prev) => {
        if (updated.status === 'failed') {
          const idx = prev.findIndex((p) => p.id === updated.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
          }
          return [...prev, updated];
        }

        // Remove when no longer failed.
        return prev.filter((p) => p.id !== updated.id);
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const primaryError = useMemo(() => failedItems[0]?.lastError, [failedItems]);

  if (failedItems.length === 0) return null;

  async function handleRetryAll() {
    if (retryingAll) return;
    setRetryingAll(true);
    try {
      // Snapshot items to avoid issues if state updates during retries.
      const snapshot = [...failedItems];
      for (const item of snapshot) {
        await retryOfflineQueueItem(item.id);
      }

      // Ensure UI matches eventual queue state.
      const latest = await listOfflineQueueItems({ status: 'failed' });
      setFailedItems(latest);
    } finally {
      setRetryingAll(false);
    }
  }

  return (
    <div className="w-full bg-red-50 border-b border-red-200 px-4 py-2 text-red-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Failed submissions detected.</p>
          <p className="text-xs text-red-800 mt-0.5">
            {failedItems.length} item{failedItems.length === 1 ? '' : 's'} failed to sync. Retry when you&apos;re back online.
          </p>
          {primaryError ? <p className="text-xs text-red-700 mt-1 break-words">{primaryError}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void handleRetryAll()}
          disabled={!isOnline || retryingAll}
          className="shrink-0 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retryingAll ? 'Retrying…' : 'Retry failed submissions'}
        </button>
      </div>
    </div>
  );
}

