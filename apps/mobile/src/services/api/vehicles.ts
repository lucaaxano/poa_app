/**
 * Vehicles API Service
 * Fahrzeug-Endpoints
 */

import { apiClient } from './client';

// Types
export interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  hsn: string | null;
  tsn: string | null;
  internalName: string | null;
  vehicleType: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Alle Fahrzeuge der Firma abrufen
 */
export const getAll = async (): Promise<Vehicle[]> => {
  const response = await apiClient.get<{ data: Vehicle[] }>('/vehicles');
  return response.data.data;
};

/**
 * Nur aktive Fahrzeuge abrufen
 */
export const getActive = async (): Promise<Vehicle[]> => {
  const vehicles = await getAll();
  return vehicles.filter(v => v.isActive);
};

/**
 * Einzelnes Fahrzeug abrufen
 */
export const getById = async (id: string): Promise<Vehicle> => {
  const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
  return response.data;
};

// Export all vehicles functions
export const vehiclesApi = {
  getAll,
  getActive,
  getById,
};
