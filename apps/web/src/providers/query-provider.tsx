'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

// Global reference to QueryClient for logout cleanup
let queryClientInstance: QueryClient | null = null;

/**
 * Get the current QueryClient instance
 * Useful for accessing the client outside of React components
 */
export function getQueryClient(): QueryClient | null {
  return queryClientInstance;
}

/**
 * Cancel all in-flight queries immediately
 * Call this FIRST on logout to prevent UI freezes from abandoned requests
 */
export function cancelAllQueries(): void {
  if (queryClientInstance) {
    queryClientInstance.cancelQueries();
  }
}

/**
 * Clear all cached queries from the QueryClient
 * Call this on logout to prevent data accumulation across sessions
 * IMPORTANT: Call cancelAllQueries() first for immediate effect
 */
export function clearQueryCache(): void {
  if (queryClientInstance) {
    // Cancel any remaining in-flight queries
    queryClientInstance.cancelQueries();
    // Clear all queries from the cache
    queryClientInstance.clear();
  }
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // PERFORMANCE FIX: Longer cache times to reduce API request frequency
            // This prevents request storms and reduces 504 timeout errors
            staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
            gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
            refetchOnWindowFocus: false,
            // AVAILABILITY FIX: Auto-retry with exponential backoff
            // Queries recover automatically when API comes back online
            retry: (failureCount, error) => {
              // Don't retry on auth errors or not-found
              if (error && typeof error === 'object' && 'response' in error) {
                const status = (error as { response?: { status?: number } }).response?.status;
                if (status === 401 || status === 403 || status === 404) return false;
              }
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
        },
      })
  );

  // Store the queryClient instance for external access (logout cleanup)
  useEffect(() => {
    queryClientInstance = queryClient;
    return () => {
      queryClientInstance = null;
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
