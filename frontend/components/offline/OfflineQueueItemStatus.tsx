'use client';

import type { OfflineQueueItemStatus } from '@/lib/offline/queue';

export default function OfflineQueueItemStatus({
  status,
  error,
  onRetry,
}: {
  status: OfflineQueueItemStatus;
  error?: string;
  onRetry?: () => void;
}) {
  if (status === 'queued') {
    return <p className="mt-3 text-xs text-amber-800">Queued for sync when you are back online.</p>;
  }

  if (status === 'syncing') {
    return <p className="mt-3 text-xs text-gray-700">Syncing…</p>;
  }

  if (status === 'synced') {
    return <p className="mt-3 text-xs text-green-700">Saved. Sync complete.</p>;
  }

  if (status === 'failed') {
    return (
      <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2">
        <p className="text-xs font-medium text-red-800">Failed to sync.</p>
        {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  return null;
}

