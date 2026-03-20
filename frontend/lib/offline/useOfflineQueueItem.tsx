'use client';

import { useEffect, useState } from 'react';
import type { OfflineQueueItem } from '@/lib/offline/queue';
import { getOfflineQueueItem, subscribeToOfflineQueueItem } from '@/lib/offline/queue';

export function useOfflineQueueItem(itemId: string | null) {
  const [item, setItem] = useState<OfflineQueueItem | null>(null);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      return;
    }

    let cancelled = false;

    getOfflineQueueItem(itemId)
      .then((loaded) => {
        if (cancelled) return;
        setItem(loaded);
      })
      .catch(() => {
        if (cancelled) return;
        setItem(null);
      });

    const unsubscribe = subscribeToOfflineQueueItem(itemId, (updated) => setItem(updated));

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [itemId]);

  return item;
}

