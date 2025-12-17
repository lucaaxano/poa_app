'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi, CompanyStats, UpdateCompanyInput } from '@/lib/api/companies';
import type { Company } from '@poa/shared';

// Query Keys
export const companyKeys = {
  all: ['company'] as const,
  current: () => [...companyKeys.all, 'current'] as const,
  stats: () => [...companyKeys.all, 'stats'] as const,
};

// Hooks
export function useCompany() {
  return useQuery({
    queryKey: companyKeys.current(),
    queryFn: companiesApi.getCurrent,
  });
}

export function useCompanyStats() {
  return useQuery({
    queryKey: companyKeys.stats(),
    queryFn: companiesApi.getStats,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCompanyInput) => companiesApi.update(data),
    onSuccess: (updatedCompany) => {
      queryClient.setQueryData(companyKeys.current(), updatedCompany);
      queryClient.invalidateQueries({ queryKey: companyKeys.stats() });
    },
  });
}
