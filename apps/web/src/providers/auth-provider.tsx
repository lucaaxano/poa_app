'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { startApiWarmup, stopApiWarmup, warmupApi } from '@/lib/api/client';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    // Start API warmup immediately to prevent cold starts
    // This runs in background and keeps the connection pool alive
    startApiWarmup();

    // Small delay to allow Zustand store rehydration to complete
    // This prevents race conditions where checkAuth runs before
    // persisted state is available
    const timer = setTimeout(async () => {
      // Ensure API is warmed up before checking auth
      await warmupApi();
      checkAuth();
    }, 50);

    return () => {
      clearTimeout(timer);
      stopApiWarmup();
    };
  }, [checkAuth]);

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
