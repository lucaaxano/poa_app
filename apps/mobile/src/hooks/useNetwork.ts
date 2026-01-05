/**
 * useNetwork Hook
 * Online/Offline Status überwachen
 */

import { useEffect, useCallback } from 'react';
import {
  useNetworkStore,
  selectIsConnected,
  selectIsInternetReachable,
  selectIsOffline,
} from '../stores/networkStore';

interface UseNetworkReturn {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  connectionType: string | null;
  checkConnection: () => void;
}

export function useNetwork(): UseNetworkReturn {
  const isConnected = useNetworkStore(selectIsConnected);
  const isInternetReachable = useNetworkStore(selectIsInternetReachable);
  const isOffline = useNetworkStore(selectIsOffline);
  const connectionType = useNetworkStore((state) => state.connectionType);
  const initialize = useNetworkStore((state) => state.initialize);
  const cleanup = useNetworkStore((state) => state.cleanup);

  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);

  const checkConnection = useCallback(() => {
    // NetInfo wird automatisch aktualisiert
    // Diese Funktion ist für manuelle Refreshes
    cleanup();
    initialize();
  }, [initialize, cleanup]);

  return {
    isConnected,
    isInternetReachable,
    isOffline,
    connectionType,
    checkConnection,
  };
}

/**
 * useOfflineAware Hook
 * Aktionen offline-aware ausführen
 */
export function useOfflineAware<T>(
  onlineAction: () => Promise<T>,
  offlineAction?: () => T | Promise<T>
) {
  const { isOffline } = useNetwork();

  const execute = useCallback(async (): Promise<T> => {
    if (isOffline && offlineAction) {
      return offlineAction();
    }
    return onlineAction();
  }, [isOffline, onlineAction, offlineAction]);

  return { execute, isOffline };
}
