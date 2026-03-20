'use client';

import { useEffect } from 'react';
import { useNetworkStatus } from '@/lib/offline/network';
import { replayOfflineQueue } from '@/lib/offline/replay';

export function useOfflineQueueReplayer() {
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!isOnline) return;
    void replayOfflineQueue();
  }, [isOnline]);

  useEffect(() => {
    function handleFocus() {
      void replayOfflineQueue();
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
}

