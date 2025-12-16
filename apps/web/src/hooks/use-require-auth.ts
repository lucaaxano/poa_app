'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useAuthStore } from '@/stores/auth-store';

export function useRequireAuth(redirectTo: Route = '/login') {
  const router = useRouter();
  const { isAuthenticated, isInitialized, isLoading } = useAuthStore();

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isInitialized, isLoading, router, redirectTo]);

  return { isAuthenticated, isInitialized, isLoading };
}

export function useRedirectIfAuthenticated(redirectTo: Route = '/dashboard') {
  const router = useRouter();
  const { isAuthenticated, isInitialized, isLoading } = useAuthStore();

  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isInitialized, isLoading, router, redirectTo]);

  return { isAuthenticated, isInitialized, isLoading };
}
