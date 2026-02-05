'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { startApiWarmup, stopApiWarmup, getLoggingOut, SESSION_EXPIRED_EVENT } from '@/lib/api/client';
import { toast } from 'sonner';

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

    // SESSION_EXPIRED_EVENT listener - notify user when session expires
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ reason: string }>;
      const reason = customEvent.detail?.reason;

      if (reason === 'auth_failed') {
        toast.error('Sitzung abgelaufen', {
          description: 'Bitte melden Sie sich erneut an.',
          duration: 5000,
        });
      } else if (reason === 'server_error') {
        toast.error('Serververbindung unterbrochen', {
          description: 'Die Verbindung wird wiederhergestellt...',
          duration: 3000,
        });
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    // NOTE: No visibility change handler here!
    // The warmup in client.ts handles keeping connections alive.
    // Auth re-verification on visibility change was causing duplicate API calls
    // and slowdowns over time. The token refresh mechanism handles expired tokens.

    return () => {
      stopApiWarmup();
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []); // Empty dependency array - runs only once

  // CRITICAL FIX: Don't block rendering with a spinner here
  // The auth-store now sets isInitialized immediately when cached data exists
  // Each layout handles its own loading state for a smoother UX
  // This prevents the "white screen" problem on first load
  return <>{children}</>;
}
