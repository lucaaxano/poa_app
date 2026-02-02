import { apiClient } from './client';
import type { Vehicle, CreateVehicleInput, UpdateVehicleInput, VehicleImportResult } from '@poa/shared';

// Vehicles API functions
export const vehiclesApi = {
  async getAll(companyId?: string): Promise<Vehicle[]> {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<Vehicle[]>('/vehicles', { params });
    return response.data;
  },

  async getById(id: string, companyId?: string): Promise<Vehicle> {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}`, { params });
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

  async downloadImportTemplate(): Promise<Blob> {
    const response = await apiClient.get('/vehicles/import/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  async importVehicles(file: File): Promise<VehicleImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<VehicleImportResult>(
      '/vehicles/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },
};
