'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { startApiWarmup, stopApiWarmup, getLoggingOut } from '@/lib/api/client';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Get checkAuth function from store
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const hasInitialized = useRef<boolean>(false);

  // Use ref to avoid dependency array issues
  const checkAuthRef = useRef(checkAuth);

  // Keep ref up to date
  useEffect(() => {
    checkAuthRef.current = checkAuth;
  }, [checkAuth]);

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
      checkAuthRef.current();
    };

    // Schedule auth check after store rehydration (microtask timing)
    // Using queueMicrotask ensures we run after Zustand rehydration
    queueMicrotask(() => {
      // Additional small delay for edge cases where localStorage is slow
      setTimeout(scheduleAuthCheck, 10);
    });

    // NOTE: No visibility change handler here!
    // The warmup in client.ts handles keeping connections alive.
    // Auth re-verification on visibility change was causing duplicate API calls
    // and slowdowns over time. The token refresh mechanism handles expired tokens.

    return () => {
      stopApiWarmup();
    };
  }, []); // Empty dependency array - runs only once

  // CRITICAL FIX: Don't block rendering with a spinner here
  // The auth-store now sets isInitialized immediately when cached data exists
  // Each layout handles its own loading state for a smoother UX
  // This prevents the "white screen" problem on first load
  return <>{children}</>;
}
