'use client';

import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setOnline] = useState(true);

  useEffect(() => {
    // Initial state
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
