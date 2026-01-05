/**
 * useLocation Hook
 * GPS-Standort abrufen
 */

import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address?: string;
}

interface UseLocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationData | null>;
  getAddressFromCoords: (lat: number, lng: number) => Promise<string | null>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      if (!granted) {
        setError('Standortberechtigung wurde verweigert');
      }
      return granted;
    } catch (err) {
      setError('Fehler bei der Standortberechtigung');
      setHasPermission(false);
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Berechtigung prüfen
      let permission = hasPermission;
      if (permission === null) {
        permission = await requestPermission();
      }

      if (!permission) {
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      // Optional: Adresse abrufen
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (addresses.length > 0) {
          const addr = addresses[0];
          const parts = [
            addr.street,
            addr.streetNumber,
            addr.postalCode,
            addr.city,
          ].filter(Boolean);
          locationData.address = parts.join(' ');
        }
      } catch {
        // Adresse ist optional
      }

      setLocation(locationData);
      return locationData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Abrufen des Standorts';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, requestPermission]);

  const getAddressFromCoords = useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

        if (addresses.length > 0) {
          const addr = addresses[0];
          const parts = [
            addr.street,
            addr.streetNumber,
            addr.postalCode,
            addr.city,
          ].filter(Boolean);
          return parts.join(' ');
        }
        return null;
      } catch {
        return null;
      }
    },
    []
  );

  return {
    location,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    getCurrentLocation,
    getAddressFromCoords,
  };
}
