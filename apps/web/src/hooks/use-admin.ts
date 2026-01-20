'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminStats,
  getAdminCompanies,
  getAdminCompanyById,
  getAdminUsers,
  getAdminUserById,
  activateUser,
  deactivateUser,
  getAdminClaims,
  getAdminClaimById,
  getAdminInsurers,
  getAdminInsurerById,
  createInsurer,
  updateInsurer,
  deleteInsurer,
  AdminCompanyFilters,
  AdminUserFilters,
  AdminClaimFilters,
  AdminInsurerFilters,
  CreateInsurerDto,
  UpdateInsurerDto,
} from '@/lib/api/admin';

// Query keys
export const adminQueryKeys = {
  all: ['admin'] as const,
  stats: () => [...adminQueryKeys.all, 'stats'] as const,
  companies: () => [...adminQueryKeys.all, 'companies'] as const,
  companiesList: (filters: AdminCompanyFilters) =>
    [...adminQueryKeys.companies(), 'list', filters] as const,
  companyDetail: (id: string) => [...adminQueryKeys.companies(), 'detail', id] as const,
  users: () => [...adminQueryKeys.all, 'users'] as const,
  usersList: (filters: AdminUserFilters) => [...adminQueryKeys.users(), 'list', filters] as const,
  userDetail: (id: string) => [...adminQueryKeys.users(), 'detail', id] as const,
  claims: () => [...adminQueryKeys.all, 'claims'] as const,
  claimsList: (filters: AdminClaimFilters) => [...adminQueryKeys.claims(), 'list', filters] as const,
  claimDetail: (id: string) => [...adminQueryKeys.claims(), 'detail', id] as const,
  insurers: () => [...adminQueryKeys.all, 'insurers'] as const,
  insurersList: (filters: AdminInsurerFilters) =>
    [...adminQueryKeys.insurers(), 'list', filters] as const,
  insurerDetail: (id: string) => [...adminQueryKeys.insurers(), 'detail', id] as const,
};

// Retry configuration for transient errors (e.g., 401 during cold-start)
const adminQueryOptions = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 3000),
};

// Stats hook
export function useAdminStats() {
  return useQuery({
    queryKey: adminQueryKeys.stats(),
    queryFn: getAdminStats,
    ...adminQueryOptions,
  });
}

// Companies hooks
export function useAdminCompanies(filters: AdminCompanyFilters = {}) {
  return useQuery({
    queryKey: adminQueryKeys.companiesList(filters),
    queryFn: () => getAdminCompanies(filters),
    ...adminQueryOptions,
  });
}

export function useAdminCompanyDetail(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.companyDetail(id),
    queryFn: () => getAdminCompanyById(id),
    enabled: !!id,
    ...adminQueryOptions,
  });
}

// Users hooks
export function useAdminUsers(filters: AdminUserFilters = {}) {
  return useQuery({
    queryKey: adminQueryKeys.usersList(filters),
    queryFn: () => getAdminUsers(filters),
    ...adminQueryOptions,
  });
}

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.userDetail(id),
    queryFn: () => getAdminUserById(id),
    enabled: !!id,
    ...adminQueryOptions,
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats() });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats() });
    },
  });
}

// Claims hooks
export function useAdminClaims(filters: AdminClaimFilters = {}) {
  return useQuery({
    queryKey: adminQueryKeys.claimsList(filters),
    queryFn: () => getAdminClaims(filters),
    ...adminQueryOptions,
  });
}

export function useAdminClaimDetail(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.claimDetail(id),
    queryFn: () => getAdminClaimById(id),
    enabled: !!id,
    ...adminQueryOptions,
  });
}

// Insurers hooks
export function useAdminInsurers(filters: AdminInsurerFilters = {}) {
  return useQuery({
    queryKey: adminQueryKeys.insurersList(filters),
    queryFn: () => getAdminInsurers(filters),
    ...adminQueryOptions,
  });
}

export function useAdminInsurerDetail(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.insurerDetail(id),
    queryFn: () => getAdminInsurerById(id),
    enabled: !!id,
    ...adminQueryOptions,
  });
}

export function useCreateInsurer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInsurerDto) => createInsurer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.insurers() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats() });
    },
  });
}

export function useUpdateInsurer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInsurerDto }) => updateInsurer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.insurers() });
    },
  });
}

export function useDeleteInsurer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInsurer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.insurers() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats() });
    },
  });
}
