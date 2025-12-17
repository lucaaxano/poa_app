import { apiClient } from './client';
import type { Vehicle, CreateVehicleInput, UpdateVehicleInput } from '@poa/shared';

// Vehicles API functions
export const vehiclesApi = {
  async getAll(): Promise<Vehicle[]> {
    const response = await apiClient.get<Vehicle[]>('/vehicles');
    return response.data;
  },

  async getById(id: string): Promise<Vehicle> {
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  async create(data: CreateVehicleInput): Promise<Vehicle> {
    const response = await apiClient.post<Vehicle>('/vehicles', data);
    return response.data;
  },

  async update(id: string, data: UpdateVehicleInput): Promise<Vehicle> {
    const response = await apiClient.patch<Vehicle>(`/vehicles/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/vehicles/${id}`);
  },

  async deactivate(id: string): Promise<Vehicle> {
    const response = await apiClient.patch<Vehicle>(`/vehicles/${id}/deactivate`);
    return response.data;
  },

  async activate(id: string): Promise<Vehicle> {
    const response = await apiClient.patch<Vehicle>(`/vehicles/${id}/activate`);
    return response.data;
  },
};
