'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '@/lib/api/vehicles';
import { useAuthStore } from '@/stores/auth-store';
import type { Vehicle, CreateVehicleInput, UpdateVehicleInput, VehicleImportResult } from '@poa/shared';

// Query Keys
export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (companyId?: string) => [...vehicleKeys.lists(), { companyId }] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string, companyId?: string) => [...vehicleKeys.details(), id, { companyId }] as const,
};

// Hooks
export function useVehicles() {
  const { user, activeCompany } = useAuthStore();
  const isBroker = user?.role === 'BROKER';

  // For brokers: require activeCompany to be selected
  const companyId = isBroker ? activeCompany?.id : undefined;
  const enabled = !isBroker || !!activeCompany;

  return useQuery({
    queryKey: vehicleKeys.list(companyId),
    queryFn: () => vehiclesApi.getAll(companyId),
    enabled,
  });
}

export function useVehicle(id: string) {
  const { user, activeCompany } = useAuthStore();
  const isBroker = user?.role === 'BROKER';
  const companyId = isBroker ? activeCompany?.id : undefined;

  return useQuery({
    queryKey: vehicleKeys.detail(id, companyId),
    queryFn: () => vehiclesApi.getById(id, companyId),
    enabled: !!id && (!isBroker || !!activeCompany),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVehicleInput) => vehiclesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehicleInput }) =>
      vehiclesApi.update(id, data),
    onSuccess: (updatedVehicle, { id }) => {
      queryClient.setQueryData(vehicleKeys.detail(id), updatedVehicle);
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vehiclesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
}

export function useDeactivateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return vehiclesApi.deactivate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
}

export function useActivateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return vehiclesApi.activate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
}

export function useImportVehicles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => vehiclesApi.importVehicles(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
}
