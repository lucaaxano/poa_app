/**
 * useClaims Hook
 * Claims-Liste laden mit Caching und Refresh
 */

import { useState, useCallback, useEffect } from 'react';
import { claimsApi, ClaimListItem, ClaimFilters, PaginatedResponse } from '../services/api/claims';

interface UseClaimsOptions {
  autoFetch?: boolean;
  initialFilters?: ClaimFilters;
}

interface UseClaimsReturn {
  claims: ClaimListItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    hasMore: boolean;
  };
  filters: ClaimFilters;
  setFilters: (filters: ClaimFilters) => void;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useClaims(options: UseClaimsOptions = {}): UseClaimsReturn {
  const { autoFetch = true, initialFilters = {} } = options;

  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState<ClaimFilters>(initialFilters);

  const fetchClaims = useCallback(
    async (page = 1, append = false) => {
      try {
        if (page === 1) {
          setIsLoading(true);
        }
        setError(null);

        const response: PaginatedResponse<ClaimListItem> = await claimsApi.getAll({
          ...filters,
          page,
          limit: filters.limit || 20,
        });

        setClaims((prev) => (append ? [...prev, ...response.data] : response.data));
        setPagination({
          page: response.page,
          totalPages: response.totalPages,
          total: response.total,
          hasMore: response.page < response.totalPages,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Schäden';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters]
  );

  const fetch = useCallback(() => fetchClaims(1), [fetchClaims]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchClaims(1);
  }, [fetchClaims]);

  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || isLoading) return;
    await fetchClaims(pagination.page + 1, true);
  }, [fetchClaims, pagination.hasMore, pagination.page, isLoading]);

  useEffect(() => {
    if (autoFetch) {
      fetchClaims(1);
    }
  }, [autoFetch, fetchClaims]);

  return {
    claims,
    isLoading,
    isRefreshing,
    error,
    pagination,
    filters,
    setFilters,
    fetch,
    refresh,
    loadMore,
  };
}

/**
 * useRecentClaims Hook
 * Nur die letzten Claims laden
 */
export function useRecentClaims(limit = 5) {
  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await claimsApi.getRecent(limit);
      setClaims(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { claims, isLoading, error, refresh: fetch };
}
