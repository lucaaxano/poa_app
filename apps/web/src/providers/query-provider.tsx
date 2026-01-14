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
 * Clear all cached queries from the QueryClient
 * Call this on logout to prevent data accumulation across sessions
 */
export function clearQueryCache(): void {
  if (queryClientInstance) {
    // Clear all queries from the cache
    queryClientInstance.clear();
    // Also cancel any in-flight queries
    queryClientInstance.cancelQueries();
  }
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // PERFORMANCE FIX: Reduced cache times for faster cleanup on logout
            // This prevents memory buildup and makes logout faster
            staleTime: 30 * 1000, // 30 seconds - data considered fresh
            gcTime: 2 * 60 * 1000, // Garbage collection after 2 minutes (was 5 minutes)
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
