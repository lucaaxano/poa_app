'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    // Small delay to allow Zustand store rehydration to complete
    // This prevents race conditions where checkAuth runs before
    // persisted state is available
    const timer = setTimeout(() => {
      checkAuth();
    }, 50);
    return () => clearTimeout(timer);
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
