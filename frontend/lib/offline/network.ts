'use client';

import { useEffect, useState } from 'react';

export function getIsOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  // `navigator.onLine` exists in browsers; jsdom may not provide it.
  if (typeof navigator.onLine === 'boolean') return navigator.onLine;
  return true;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(getIsOnline());

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // In case the initial mount is wrong (e.g. some test environments).
    setIsOnline(getIsOnline());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}

