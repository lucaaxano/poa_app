import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  brokerApi,
  type BrokerAggregatedStats,
  type BrokerCompanyStats,
  type BrokerClaimFilters,
  type PaginatedBrokerClaims,
} from '@/lib/api/broker';
import { useAuthStore, type BrokerCompany } from '@/stores/auth-store';

// Query keys
export const brokerKeys = {
  all: ['broker'] as const,
  companies: () => [...brokerKeys.all, 'companies'] as const,
  stats: () => [...brokerKeys.all, 'stats'] as const,
  companyStats: (companyId: string) =>
    [...brokerKeys.all, 'company', companyId, 'stats'] as const,
  claims: (filters?: BrokerClaimFilters) =>
    [...brokerKeys.all, 'claims', filters] as const,
};

/**
 * Hook to fetch all companies linked to the broker
 */
export function useBrokerCompanies() {
  const { user, setLinkedCompanies } = useAuthStore();
  const isBroker = user?.role === 'BROKER';

  const query = useQuery({
    queryKey: brokerKeys.companies(),
    queryFn: brokerApi.getLinkedCompanies,
    enabled: isBroker,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync to store when data changes
  useEffect(() => {
    if (query.data) {
      setLinkedCompanies(query.data);
    }
  }, [query.data, setLinkedCompanies]);

  return query;
}

/**
 * Hook to fetch aggregated stats across all broker companies
 */
export function useBrokerStats() {
  const { user } = useAuthStore();
  const isBroker = user?.role === 'BROKER';

  return useQuery<BrokerAggregatedStats>({
    queryKey: brokerKeys.stats(),
    queryFn: brokerApi.getAggregatedStats,
    enabled: isBroker,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch stats for a specific company
 */
export function useBrokerCompanyStats(companyId: string | null) {
  const { user } = useAuthStore();
  const isBroker = user?.role === 'BROKER';

  return useQuery<BrokerCompanyStats>({
    queryKey: brokerKeys.companyStats(companyId || ''),
    queryFn: () => brokerApi.getCompanyStats(companyId!),
    enabled: isBroker && !!companyId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch claims for broker with optional filters
 */
export function useBrokerClaims(filters?: BrokerClaimFilters) {
  const { user } = useAuthStore();
  const isBroker = user?.role === 'BROKER';

  return useQuery<PaginatedBrokerClaims>({
    queryKey: brokerKeys.claims(filters),
    queryFn: () => brokerApi.getClaims(filters),
    enabled: isBroker,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get the current active company context
 * Returns either the selected company stats or aggregated stats
 */
export function useActiveCompanyContext() {
  const { user, activeCompany } = useAuthStore();
  const isBroker = user?.role === 'BROKER';

  const aggregatedStats = useBrokerStats();
  const companyStats = useBrokerCompanyStats(activeCompany?.id || null);

  if (!isBroker) {
    return {
      isLoading: false,
      stats: null,
      isAggregated: false,
    };
  }

  if (activeCompany) {
    return {
      isLoading: companyStats.isLoading,
      stats: companyStats.data,
      isAggregated: false,
      company: activeCompany,
    };
  }

  return {
    isLoading: aggregatedStats.isLoading,
    stats: aggregatedStats.data,
    isAggregated: true,
    company: null,
  };
}

/**
 * Hook to invalidate broker data and refetch
 */
export function useRefreshBrokerData() {
  const queryClient = useQueryClient();

  return {
    refreshCompanies: () =>
      queryClient.invalidateQueries({ queryKey: brokerKeys.companies() }),
    refreshStats: () =>
      queryClient.invalidateQueries({ queryKey: brokerKeys.stats() }),
    refreshAll: () =>
      queryClient.invalidateQueries({ queryKey: brokerKeys.all }),
  };
}
