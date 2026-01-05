/**
 * useVehicles Hook
 * Fahrzeuge laden mit Caching
 */

import { useState, useCallback, useEffect } from 'react';
import { vehiclesApi, Vehicle } from '../services/api/vehicles';

interface UseVehiclesOptions {
  autoFetch?: boolean;
  onlyActive?: boolean;
}

interface UseVehiclesReturn {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  getById: (id: string) => Vehicle | undefined;
}

export function useVehicles(options: UseVehiclesOptions = {}): UseVehiclesReturn {
  const { autoFetch = true, onlyActive = true } = options;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = onlyActive
        ? await vehiclesApi.getActive()
        : await vehiclesApi.getAll();
      setVehicles(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Laden der Fahrzeuge';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onlyActive]);

  const getById = useCallback(
    (id: string): Vehicle | undefined => {
      return vehicles.find((v) => v.id === id);
    },
    [vehicles]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchVehicles();
    }
  }, [autoFetch, fetchVehicles]);

  return {
    vehicles,
    isLoading,
    error,
    fetch: fetchVehicles,
    refresh: fetchVehicles,
    getById,
  };
}

/**
 * useVehicle Hook
 * Einzelnes Fahrzeug laden
 */
export function useVehicle(vehicleId: string) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicle = useCallback(async () => {
    if (!vehicleId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await vehiclesApi.getById(vehicleId);
      setVehicle(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Laden des Fahrzeugs';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  return { vehicle, isLoading, error, refresh: fetchVehicle };
}
