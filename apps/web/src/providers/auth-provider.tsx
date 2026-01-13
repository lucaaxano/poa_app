'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { startApiWarmup, stopApiWarmup, warmupApi, getLoggingOut } from '@/lib/api/client';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isInitialized, isAuthenticated } = useAuthStore();
  const lastVisibilityCheck = useRef<number>(0);
  const isCheckingAuth = useRef<boolean>(false);

  useEffect(() => {
    // Start API warmup immediately to prevent cold starts
    // This runs in background and keeps the connection pool alive
    startApiWarmup();

    // Small delay to allow Zustand store rehydration to complete
    // This prevents race conditions where checkAuth runs before
    // persisted state is available
    const timer = setTimeout(async () => {
      // Skip if logging out
      if (getLoggingOut()) return;

      // Ensure API is warmed up before checking auth
      await warmupApi();
      checkAuth();
    }, 50);

    // Enhanced visibility change handler for better session stability
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      // Skip if logging out
      if (getLoggingOut()) return;

      // Debounce: only check if more than 5 seconds since last check
      const now = Date.now();
      if (now - lastVisibilityCheck.current < 5000) return;
      lastVisibilityCheck.current = now;

      // Skip if already checking or not authenticated
      if (isCheckingAuth.current) return;
      if (!isAuthenticated) return;

      isCheckingAuth.current = true;

      try {
        // Warm up API first to prevent timeout on first request
        await warmupApi();

        // Then verify auth in background
        await checkAuth();
      } catch (error) {
        console.warn('[AuthProvider] Visibility check failed:', error);
      } finally {
        isCheckingAuth.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      stopApiWarmup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuth, isAuthenticated]);

  // Show nothing while checking auth to avoid flash
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
