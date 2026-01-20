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
