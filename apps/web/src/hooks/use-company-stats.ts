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

export function useStatsTimeline(
  period: 'week' | 'month' = 'month',
  range: number = 12
) {
  return useQuery({
    queryKey: companyKeys.statsTimeline(period, range),
    queryFn: () => companiesApi.getStatsTimeline(period, range),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useStatsByVehicle(limit: number = 10) {
  return useQuery({
    queryKey: companyKeys.statsByVehicle(limit),
    queryFn: () => companiesApi.getStatsByVehicle(limit),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useStatsByDriver(limit: number = 10) {
  return useQuery({
    queryKey: companyKeys.statsByDriver(limit),
    queryFn: () => companiesApi.getStatsByDriver(limit),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useStatsByCategory() {
  return useQuery({
    queryKey: companyKeys.statsByCategory(),
    queryFn: companiesApi.getStatsByCategory,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useQuotaStats(year?: number) {
  return useQuery({
    queryKey: companyKeys.statsQuota(year),
    queryFn: () => companiesApi.getQuotaStats(year),
    staleTime: 60 * 1000, // 1 minute
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

export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => companiesApi.uploadLogo(file),
    onSuccess: (updatedCompany) => {
      queryClient.setQueryData(companyKeys.current(), updatedCompany);
    },
  });
}

export function useDeleteLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => companiesApi.deleteLogo(),
    onSuccess: (updatedCompany) => {
      queryClient.setQueryData(companyKeys.current(), updatedCompany);
    },
  });
}
