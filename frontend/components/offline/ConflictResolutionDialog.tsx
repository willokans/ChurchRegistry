'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuth } from '@/lib/api';
import { replayOfflineQueue } from '@/lib/offline/replay';
import type { OfflineQueueItem } from '@/lib/offline/queue';
import {
  getOfflineQueueItem,
  listOfflineQueueItems,
  subscribeToOfflineQueueItemUpdates,
  updateOfflineQueueItemStatus,
} from '@/lib/offline/queue';

function findFirstPendingConflict(items: OfflineQueueItem[]): OfflineQueueItem | null {
  for (const item of items) {
    const conflict = item.replayState?.conflict;
    if (item.status === 'failed' && conflict && conflict.resolvedChoice == null) return item;
  }
  return null;
}

function findFirstPendingAuth(items: OfflineQueueItem[]): OfflineQueueItem | null {
  for (const item of items) {
    if (item.status === 'queued' && item.replayState?.authRequiredAt) return item;
  }
  return null;
}

export default function ConflictResolutionDialog() {
  const router = useRouter();
  const [pendingConflictItem, setPendingConflictItem] = useState<OfflineQueueItem | null>(null);
  const [pendingAuthItem, setPendingAuthItem] = useState<OfflineQueueItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const failed = await listOfflineQueueItems({ status: 'failed' });
      const queued = await listOfflineQueueItems({ status: 'queued' });
      if (cancelled) return;
      setPendingConflictItem(findFirstPendingConflict(failed));
      setPendingAuthItem(findFirstPendingAuth(queued));
    }

    void load();

    const unsubscribe = subscribeToOfflineQueueItemUpdates((updated) => {
      if (updated.status === 'failed') {
        const conflict = updated.replayState?.conflict;
        if (conflict && conflict.resolvedChoice == null) setPendingConflictItem(updated);
        return;
      }

      if (updated.status === 'queued') {
        if (updated.replayState?.authRequiredAt) setPendingAuthItem(updated);
        return;
      }

      // If this item moved to a non-pending state, clear it if it matches.
      setPendingConflictItem((prev) => (prev?.id === updated.id ? null : prev));
      setPendingAuthItem((prev) => (prev?.id === updated.id ? null : prev));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const active = pendingAuthItem ?? pendingConflictItem;

  const dialog = useMemo(() => {
    if (!active) return null;

    if (pendingAuthItem && active.id === pendingAuthItem.id) {
      return {
        kind: 'auth' as const,
        title: 'Session expired',
        message: active.lastError ?? 'Please sign in again to continue syncing offline submissions.',
      };
    }

    const conflict = pendingConflictItem?.replayState?.conflict;
    return {
      kind: 'conflict' as const,
      title: 'Record already exists',
      message: conflict?.message ?? active.lastError ?? 'A record already exists on the server.',
      conflictKind: conflict?.kind,
    };
  }, [active, pendingAuthItem, pendingConflictItem]);

  if (!dialog) return null;

  if (dialog.kind === 'auth') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl p-5">
          <h2 className="text-lg font-semibold text-gray-900">{dialog.title}</h2>
          <p className="mt-2 text-sm text-gray-700">{dialog.message}</p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              className="rounded-lg bg-sancta-maroon px-4 py-2 text-sm font-medium text-white hover:bg-sancta-maroon-dark"
              onClick={() => {
                // Clear local auth so the app can redirect to a clean sign-in flow.
                clearAuth();
                setPendingAuthItem(null);
                router.push('/login');
              }}
            >
              Sign in again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // conflict dialog
  const item = pendingConflictItem;
  if (!item) return null;

  const conflictKind = item.replayState?.conflict?.kind;
  const primaryLabel = 'Use server version';
  const secondaryLabel = 'Use my local version';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl p-5">
        <h2 className="text-lg font-semibold text-gray-900">{dialog.title}</h2>
        <p className="mt-2 text-sm text-gray-700">{dialog.message}</p>

        <p className="mt-3 text-xs text-gray-500">
          {conflictKind ? `Resolution needed for: ${conflictKind}` : 'Resolution needed for this record.'}
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => {
              void (async () => {
                const latest = await getOfflineQueueItem(item.id);
                const latestConflict = latest?.replayState?.conflict;
                if (!latest || !latestConflict) return;

                await updateOfflineQueueItemStatus(item.id, 'queued', {
                  lastError: undefined,
                  replayState: {
                    ...latest.replayState,
                    conflict: { ...latestConflict, resolvedChoice: 'local' },
                  },
                });

                setPendingConflictItem(null);
                await replayOfflineQueue({ onlyItemId: item.id });
              })();
            }}
          >
            {secondaryLabel}
          </button>
          <button
            type="button"
            className="rounded-lg bg-sancta-maroon px-4 py-2 text-sm font-medium text-white hover:bg-sancta-maroon-dark"
            onClick={() => {
              void (async () => {
                const latest = await getOfflineQueueItem(item.id);
                const latestConflict = latest?.replayState?.conflict;
                if (!latest || !latestConflict) return;

                await updateOfflineQueueItemStatus(item.id, 'queued', {
                  lastError: undefined,
                  replayState: {
                    ...latest.replayState,
                    conflict: { ...latestConflict, resolvedChoice: 'server' },
                  },
                });

                setPendingConflictItem(null);
                await replayOfflineQueue({ onlyItemId: item.id });
              })();
            }}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

