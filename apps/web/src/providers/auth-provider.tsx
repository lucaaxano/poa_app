'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { startApiWarmup, stopApiWarmup, getLoggingOut } from '@/lib/api/client';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isInitialized, isAuthenticated } = useAuthStore();
  const lastVisibilityCheck = useRef<number>(0);
  const isCheckingAuth = useRef<boolean>(false);
  const hasInitialized = useRef<boolean>(false);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Start API warmup immediately - handles its own visibility change listener
    // This also performs initial warmup, no need to call warmupApi() separately
    startApiWarmup();

    // Use requestIdleCallback for non-blocking auth check
    // Falls back to setTimeout for browsers that don't support it
    const scheduleAuthCheck = () => {
      if (getLoggingOut()) return;
      checkAuth();
    };

    // Schedule auth check after store rehydration (microtask timing)
    // Using queueMicrotask ensures we run after Zustand rehydration
    queueMicrotask(() => {
      // Additional small delay for edge cases where localStorage is slow
      setTimeout(scheduleAuthCheck, 10);
    });

    // Visibility change handler - only for re-verifying auth when user returns
    // Note: startApiWarmup already handles warmup on visibility change
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      if (getLoggingOut()) return;

      // Debounce: only check if more than 10 seconds since last check
      const now = Date.now();
      if (now - lastVisibilityCheck.current < 10000) return;
      lastVisibilityCheck.current = now;

      // Skip if already checking or not authenticated
      if (isCheckingAuth.current) return;
      if (!isAuthenticated) return;

      isCheckingAuth.current = true;

      try {
        // No need to warmupApi() here - startApiWarmup handles it
        await checkAuth();
      } catch (error) {
        console.warn('[AuthProvider] Visibility check failed:', error);
      } finally {
        isCheckingAuth.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopApiWarmup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuth, isAuthenticated]);

  // Show loading spinner only during initial auth check
  // The spinner is minimal and doesn't block the entire UI
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
