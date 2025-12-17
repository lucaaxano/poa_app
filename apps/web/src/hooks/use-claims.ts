'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi, ClaimFilters } from '@/lib/api/claims';
import type { CreateClaimInput, UpdateClaimInput } from '@poa/shared';

// Query Keys
export const claimKeys = {
  all: ['claims'] as const,
  lists: () => [...claimKeys.all, 'list'] as const,
  list: (filters?: ClaimFilters) => [...claimKeys.lists(), filters] as const,
  recent: (limit: number) => [...claimKeys.lists(), 'recent', limit] as const,
  details: () => [...claimKeys.all, 'detail'] as const,
  detail: (id: string) => [...claimKeys.details(), id] as const,
  comments: (id: string) => [...claimKeys.detail(id), 'comments'] as const,
  events: (id: string) => [...claimKeys.detail(id), 'events'] as const,
};

// Hooks
export function useClaims(filters?: ClaimFilters) {
  return useQuery({
    queryKey: claimKeys.list(filters),
    queryFn: () => claimsApi.getAll(filters),
  });
}

export function useRecentClaims(limit: number = 5) {
  return useQuery({
    queryKey: claimKeys.recent(limit),
    queryFn: () => claimsApi.getRecent(limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useClaim(id: string) {
  return useQuery({
    queryKey: claimKeys.detail(id),
    queryFn: () => claimsApi.getById(id),
    enabled: !!id,
  });
}

export function useClaimComments(id: string) {
  return useQuery({
    queryKey: claimKeys.comments(id),
    queryFn: () => claimsApi.getComments(id),
    enabled: !!id,
  });
}

export function useClaimEvents(id: string) {
  return useQuery({
    queryKey: claimKeys.events(id),
    queryFn: () => claimsApi.getEvents(id),
    enabled: !!id,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClaimInput) => claimsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
    },
  });
}

export function useUpdateClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClaimInput }) =>
      claimsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: claimKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
    },
  });
}

export function useSubmitClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => claimsApi.submit(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: claimKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
    },
  });
}

export function useApproveClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => claimsApi.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: claimKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
    },
  });
}

export function useRejectClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      claimsApi.reject(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: claimKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
    },
  });
}

export function useSendClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => claimsApi.send(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: claimKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
    },
  });
}

export function useAddClaimComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      claimsApi.addComment(id, content),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: claimKeys.comments(id) });
      queryClient.invalidateQueries({ queryKey: claimKeys.detail(id) });
    },
  });
}
