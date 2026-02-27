'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const CHECK_INTERVAL_MS = 10000; // Check every 10 seconds when offline
const INITIAL_DELAY_MS = 5000; // Wait 5s before first check (let app load)

export function ConnectionStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const checkConnection = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!mountedRef.current) return;

      if (response.ok) {
        if (isOffline) {
          setIsReconnecting(true);
          setTimeout(() => {
            if (mountedRef.current) {
              setIsOffline(false);
              setIsReconnecting(false);
            }
          }, 2000);
        }
      } else {
        setIsOffline(true);
      }
    } catch {
      if (mountedRef.current) {
        setIsOffline(true);
      }
    }
  }, [isOffline]);

  useEffect(() => {
    mountedRef.current = true;

    const initialTimer = setTimeout(() => {
      checkConnection();
      intervalRef.current = setInterval(checkConnection, CHECK_INTERVAL_MS);
    }, INITIAL_DELAY_MS);

    return () => {
      mountedRef.current = false;
      clearTimeout(initialTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkConnection]);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 shadow-md">
      {isReconnecting ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Verbindung wiederhergestellt...
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          Serververbindung unterbrochen. Automatische Wiederverbindung...
        </>
      )}
    </div>
  );
}
