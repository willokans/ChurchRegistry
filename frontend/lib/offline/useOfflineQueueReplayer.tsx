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
    function replayNow() {
      void replayOfflineQueue();
    }

    // Desktop focus.
    window.addEventListener('focus', replayNow);

    // App visibility / foreground transitions (tab restore, mobile browsers).
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') replayNow();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // iOS/Safari bfcache restore.
    window.addEventListener('pageshow', replayNow);

    // iOS PWA "resume" event (supported in some WebViews).
    window.addEventListener('resume', replayNow as unknown as EventListener);

    return () => {
      window.removeEventListener('focus', replayNow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', replayNow);
      window.removeEventListener('resume', replayNow as unknown as EventListener);
    };
  }, []);
}

