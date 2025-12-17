'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getInsurers,
  type Policy,
  type CreatePolicyData,
  type UpdatePolicyData,
  type Insurer,
} from '@/lib/api/policies';

// Query keys
export const policyKeys = {
  all: ['policies'] as const,
  lists: () => [...policyKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...policyKeys.lists(), filters] as const,
  details: () => [...policyKeys.all, 'detail'] as const,
  detail: (id: string) => [...policyKeys.details(), id] as const,
};

export const insurerKeys = {
  all: ['insurers'] as const,
  lists: () => [...insurerKeys.all, 'list'] as const,
};

// Insurers hooks
export function useInsurers() {
  return useQuery<Insurer[], Error>({
    queryKey: insurerKeys.lists(),
    queryFn: getInsurers,
  });
}

// Policies hooks
export function usePolicies() {
  return useQuery<Policy[], Error>({
    queryKey: policyKeys.lists(),
    queryFn: getPolicies,
  });
}

export function usePolicy(id: string) {
  return useQuery<Policy, Error>({
    queryKey: policyKeys.detail(id),
    queryFn: () => getPolicyById(id),
    enabled: !!id,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();

  return useMutation<Policy, Error, CreatePolicyData>({
    mutationFn: createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.lists() });
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();

  return useMutation<Policy, Error, { id: string; data: UpdatePolicyData }>({
    mutationFn: ({ id, data }) => updatePolicy(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: policyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: policyKeys.detail(id) });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();

  return useMutation<Policy, Error, string>({
    mutationFn: deletePolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.lists() });
    },
  });
}
