'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  companiesApi,
  CompanyStats,
  UpdateCompanyInput,
  TimelineStats,
  VehicleStatsItem,
  DriverStatsItem,
  CategoryStatsItem,
  QuotaStats,
} from '@/lib/api/companies';
import { useAuthStore } from '@/stores/auth-store';
import type { Company } from '@poa/shared';

// Query Keys
export const companyKeys = {
  all: ['company'] as const,
  current: () => [...companyKeys.all, 'current'] as const,
  stats: () => [...companyKeys.all, 'stats'] as const,
  statsTimeline: (period: 'week' | 'month', range: number) =>
    [...companyKeys.all, 'stats', 'timeline', period, range] as const,
  statsByVehicle: (limit: number) =>
    [...companyKeys.all, 'stats', 'by-vehicle', limit] as const,
  statsByDriver: (limit: number) =>
    [...companyKeys.all, 'stats', 'by-driver', limit] as const,
  statsByCategory: () => [...companyKeys.all, 'stats', 'by-category'] as const,
  statsQuota: (year?: number) =>
    [...companyKeys.all, 'stats', 'quota', year] as const,
};

// Helper to check if user is not a broker (brokers don't have a single companyId)
function useIsNotBroker() {
  const user = useAuthStore((state) => state.user);
  return user?.role !== 'BROKER';
}

// Hooks
export function useCompany() {
  const isNotBroker = useIsNotBroker();
  return useQuery({
    queryKey: companyKeys.current(),
    queryFn: companiesApi.getCurrent,
    enabled: isNotBroker,
  });
}

export function useCompanyStats() {
  const isNotBroker = useIsNotBroker();
  return useQuery({
    queryKey: companyKeys.stats(),
    queryFn: companiesApi.getStats,
    enabled: isNotBroker,
  });
}

export function useStatsTimeline(
  period: 'week' | 'month' = 'month',
  range: number = 12
) {
  const isNotBroker = useIsNotBroker();
  return useQuery({
    queryKey: companyKeys.statsTimeline(period, range),
    queryFn: () => companiesApi.getStatsTimeline(period, range),
    enabled: isNotBroker,
  });
}

export function useStatsByVehicle(limit: number = 10) {
  const isNotBroker = useIsNotBroker();
  return useQuery({
    queryKey: companyKeys.statsByVehicle(limit),
    queryFn: () => companiesApi.getStatsByVehicle(limit),
    enabled: isNotBroker,
  });
}

export function useStatsByDriver(limit: number = 10) {
  const isNotBroker = useIsNotBroker();
  return useQuery({
    queryKey: companyKeys.statsByDriver(limit),
    queryFn: () => companiesApi.getStatsByDriver(limit),
    enabled: isNotBroker,
  });
}

export function useStatsByCategory() {
  const isNotBroker = useIsNotBroker();
  return useQuery({
    queryKey: companyKeys.statsByCategory(),
    queryFn: companiesApi.getStatsByCategory,
    enabled: isNotBroker,
  });
}

export function useQuotaStats(year?: number) {
  const isNotBroker = useIsNotBroker();
  return useQuery({
    queryKey: companyKeys.statsQuota(year),
    queryFn: () => companiesApi.getQuotaStats(year),
    enabled: isNotBroker,
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCompanyInput) => companiesApi.update(data),
    onSuccess: (updatedCompany) => {
      queryClient.setQueryData(companyKeys.current(), updatedCompany);
      // Stats are NOT invalidated - they use the global staleTime
    },
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => companiesApi.uploadLogo(file),
    onSuccess: (updatedCompany) => {
      queryClient.setQueryData(companyKeys.current(), updatedCompany);
      // Update Auth Store so UserMenu shows new logo
      const { user, setUser } = useAuthStore.getState();
      setUser(user, updatedCompany as any);
    },
  });
}

export function useDeleteLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => companiesApi.deleteLogo(),
    onSuccess: (updatedCompany) => {
      queryClient.setQueryData(companyKeys.current(), updatedCompany);
      // Update Auth Store so UserMenu removes logo
      const { user, setUser } = useAuthStore.getState();
      setUser(user, updatedCompany as any);
    },
  });
}
