'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OfflineQueueItem, OfflineQueueItemReplayState, OfflineQueueItemStatus, OfflineSubmissionKind } from '@/lib/offline/queue';
import {
  getOfflineQueueItem,
  listOfflineQueueItems,
  subscribeToOfflineQueueItemUpdates,
  updateOfflineQueueItemStatus,
} from '@/lib/offline/queue';
import { useNetworkStatus } from '@/lib/offline/network';
import { replayOfflineQueue, retryOfflineQueueItem } from '@/lib/offline/replay';
import { clearAuth } from '@/lib/api';

function formatTimestamp(ts: number | undefined) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function submissionKindLabel(kind: OfflineSubmissionKind): string {
  switch (kind) {
    case 'baptism_create':
      return 'Baptism';
    case 'communion_create':
      return 'Holy Communion';
    case 'confirmation_create':
      return 'Confirmation';
    case 'marriage_create':
      return 'Marriage';
    case 'holy_order_create':
      return 'Holy Order';
  }
  return String(kind);
}

function statusMeta(status: OfflineQueueItemStatus): { label: string; badgeClassName: string } {
  switch (status) {
    case 'queued':
      return { label: 'Queued', badgeClassName: 'bg-amber-100 text-amber-900 border-amber-200' };
    case 'syncing':
      return { label: 'Syncing', badgeClassName: 'bg-gray-100 text-gray-700 border-gray-200' };
    case 'synced':
      return { label: 'Synced', badgeClassName: 'bg-green-100 text-green-800 border-green-200' };
    case 'failed':
      return { label: 'Failed', badgeClassName: 'bg-red-100 text-red-800 border-red-200' };
  }
}

type OfflineConflictKind = NonNullable<OfflineQueueItemReplayState['conflict']>['kind'];

function conflictKindLabel(kind: OfflineConflictKind): string {
  // Keep the label stable even if conflict kinds change in the backend.
  switch (kind) {
    case 'communion_already_exists_for_baptism':
      return 'Holy Communion already exists for this Baptism';
    case 'confirmation_already_exists_for_communion':
      return 'Confirmation already exists for this Communion';
    case 'marriage_already_exists_for_confirmation':
      return 'Marriage already exists for this Confirmation';
    case 'marriage_already_exists_for_baptism':
      return 'Marriage already exists for this Baptism';
    case 'holy_order_already_exists_for_confirmation':
      return 'Holy Order already exists for this Confirmation';
  }
  return String(kind);
}

export default function PendingSyncOutbox() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();

  const [items, setItems] = useState<OfflineQueueItem[]>([]);
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const all = await listOfflineQueueItems();
        if (cancelled) return;
        // Most recently updated first.
        setItems(all.sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)));
      } catch {
        if (cancelled) return;
        setItems([]);
      }
    }

    void refresh();

    const unsubscribe = subscribeToOfflineQueueItemUpdates(() => {
      // We intentionally refresh on updates to avoid stale UI when the underlying queue
      // item structure changes during replay steps.
      void refresh();
    });

    // Some operations delete queue items without emitting update events (e.g. after sync cleanup).
    // Periodic refresh keeps the outbox view accurate.
    const interval = window.setInterval(() => {
      void refresh();
    }, 15_000);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  const pendingQueued = useMemo(() => items.filter((i) => i.status === 'queued'), [items]);
  const syncingItems = useMemo(() => items.filter((i) => i.status === 'syncing'), [items]);
  const failedItems = useMemo(() => items.filter((i) => i.status === 'failed'), [items]);
  const syncedItems = useMemo(() => items.filter((i) => i.status === 'synced'), [items]);

  const summaryCounts = useMemo(() => {
    return {
      queued: pendingQueued.length,
      syncing: syncingItems.length,
      failed: failedItems.length,
      synced: syncedItems.length,
    };
  }, [pendingQueued.length, syncingItems.length, failedItems.length, syncedItems.length]);

  async function handleRetry(itemId: string) {
    setBusyById((prev) => ({ ...prev, [itemId]: true }));
    try {
      await retryOfflineQueueItem(itemId);
    } finally {
      setBusyById((prev) => ({ ...prev, [itemId]: false }));
    }
  }

  async function handleResolveConflict(itemId: string, resolvedChoice: 'server' | 'local') {
    setBusyById((prev) => ({ ...prev, [itemId]: true }));
    try {
      const latest = await getOfflineQueueItem(itemId);
      const conflict = latest?.replayState?.conflict;
      if (!latest || !conflict) return;
      if (conflict.resolvedChoice != null) return;

      await updateOfflineQueueItemStatus(itemId, 'queued', {
        lastError: undefined,
        replayState: {
          ...(latest.replayState ?? {}),
          conflict: { ...conflict, resolvedChoice },
        },
      });

      await replayOfflineQueue({ onlyItemId: itemId });
    } finally {
      setBusyById((prev) => ({ ...prev, [itemId]: false }));
    }
  }

  function QueueItemCard({ item }: { item: OfflineQueueItem }) {
    const meta = statusMeta(item.status);
    const retrying = busyById[item.id] ?? false;
    const conflict = item.replayState?.conflict;
    const pendingConflict = item.status === 'failed' && conflict && conflict.resolvedChoice == null;
    const authRequired = item.status === 'queued' && item.replayState?.authRequiredAt;

    return (
      <li className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-gray-900">
                {submissionKindLabel(item.submission.kind)}
              </h3>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badgeClassName}`}>
                {meta.label}
              </span>
              <span className="text-[11px] text-gray-500 font-mono truncate max-w-[11rem]" title={item.id}>
                {item.id}
              </span>
              {item.retryCount > 0 && (
                <span className="text-[11px] text-gray-600">
                  retry #{item.retryCount}
                </span>
              )}
            </div>

            <div className="mt-2 text-xs text-gray-600">
              <div>Created: {formatTimestamp(item.createdAt)}</div>
              <div>Last update: {formatTimestamp(item.updatedAt)}</div>
            </div>
          </div>
        </div>

        {authRequired ? (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs font-medium text-amber-900">Session expired</p>
            <p className="mt-1 text-xs text-amber-800">
              {item.lastError ?? 'Please sign in again to continue syncing offline submissions.'}
            </p>
            <button
              type="button"
              onClick={() => {
                clearAuth();
                router.push('/login');
              }}
              className="mt-2 inline-flex items-center rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800"
            >
              Sign in again
            </button>
          </div>
        ) : null}

        {item.status === 'failed' ? (
          <div className="mt-3">
            {pendingConflict ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-xs font-medium text-red-900">Conflict requires a resolution</p>
                <p className="mt-1 text-xs text-red-800">
                  {conflictKindLabel(conflict.kind)}.
                </p>
                <p className="mt-1 text-xs text-red-700 break-words">{conflict.message}</p>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={retrying}
                    onClick={() => void handleResolveConflict(item.id, 'local')}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use my local version
                  </button>
                  <button
                    type="button"
                    disabled={retrying}
                    onClick={() => void handleResolveConflict(item.id, 'server')}
                    className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use server version
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-xs font-medium text-red-800">Failed to sync</p>
                {item.lastError ? (
                  <p className="mt-1 text-xs text-red-700 break-words">{item.lastError}</p>
                ) : null}
                <button
                  type="button"
                  disabled={!isOnline || retrying}
                  onClick={() => void handleRetry(item.id)}
                  className="mt-2 inline-flex items-center rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retrying ? 'Retrying…' : 'Retry'}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </li>
    );
  }

  const hasAny = summaryCounts.queued + summaryCounts.syncing + summaryCounts.failed + summaryCounts.synced > 0;
  if (!hasAny) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">No pending offline submissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-700">Outbox summary:</span>
          {summaryCounts.queued > 0 ? (
            <span className="text-sm text-amber-900">Queued: {summaryCounts.queued}</span>
          ) : null}
          {summaryCounts.syncing > 0 ? (
            <span className="text-sm text-gray-700">Syncing: {summaryCounts.syncing}</span>
          ) : null}
          {summaryCounts.failed > 0 ? (
            <span className="text-sm text-red-800">Failed: {summaryCounts.failed}</span>
          ) : null}
          {summaryCounts.synced > 0 ? (
            <span className="text-sm text-green-800">Synced: {summaryCounts.synced}</span>
          ) : null}
        </div>
      </div>

      {pendingQueued.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Queued</h2>
          <ul className="space-y-3">
            {pendingQueued.map((item) => (
              <QueueItemCard key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ) : null}

      {syncingItems.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Syncing</h2>
          <ul className="space-y-3">
            {syncingItems.map((item) => (
              <QueueItemCard key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ) : null}

      {failedItems.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Failed</h2>
          <ul className="space-y-3">
            {failedItems.map((item) => (
              <QueueItemCard key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ) : null}

      {syncedItems.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Synced</h2>
          <ul className="space-y-3">
            {syncedItems.map((item) => (
              <QueueItemCard key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

