/**
 * useCamera Hook
 * Kamera und Galerie Zugriff
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface CapturedImage {
  id: string;
  uri: string;
  name: string;
  type: string;
  width: number;
  height: number;
}

interface UseCameraOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  allowsEditing?: boolean;
}

interface UseCameraReturn {
  isLoading: boolean;
  error: string | null;
  takePhoto: () => Promise<CapturedImage | null>;
  pickFromGallery: () => Promise<CapturedImage | null>;
  pickMultipleFromGallery: () => Promise<CapturedImage[]>;
  requestCameraPermission: () => Promise<boolean>;
  requestGalleryPermission: () => Promise<boolean>;
}

const generateId = () => `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getFileName = (uri: string): string => {
  const parts = uri.split('/');
  return parts[parts.length - 1] || `photo_${Date.now()}.jpg`;
};

const getMimeType = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
};

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    allowsEditing = false,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Kameraberechtigung erforderlich',
          'Bitte erlauben Sie den Kamerazugriff in den Einstellungen.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch {
      setError('Fehler bei der Kameraberechtigung');
      return false;
    }
  }, []);

  const requestGalleryPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Galerieberechtigung erforderlich',
          'Bitte erlauben Sie den Galeriezugriff in den Einstellungen.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch {
      setError('Fehler bei der Galerieberechtigung');
      return false;
    }
  }, []);

  const processResult = useCallback(
    (result: ImagePicker.ImagePickerResult): CapturedImage | null => {
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        id: generateId(),
        uri: asset.uri,
        name: getFileName(asset.uri),
        type: getMimeType(asset.uri),
        width: asset.width,
        height: asset.height,
      };
    },
    []
  );

  const takePhoto = useCallback(async (): Promise<CapturedImage | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        quality,
        exif: false,
      });

      return processResult(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Aufnehmen des Fotos';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [allowsEditing, quality, processResult, requestCameraPermission]);

  const pickFromGallery = useCallback(async (): Promise<CapturedImage | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        quality,
        exif: false,
      });

      return processResult(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Auswählen des Fotos';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [allowsEditing, quality, processResult, requestGalleryPermission]);

  const pickMultipleFromGallery = useCallback(async (): Promise<CapturedImage[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) return [];

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality,
        exif: false,
        selectionLimit: 10,
      });

      if (result.canceled || !result.assets) return [];

      return result.assets.map((asset) => ({
        id: generateId(),
        uri: asset.uri,
        name: getFileName(asset.uri),
        type: getMimeType(asset.uri),
        width: asset.width,
        height: asset.height,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Auswählen der Fotos';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [quality, requestGalleryPermission]);

  return {
    isLoading,
    error,
    takePhoto,
    pickFromGallery,
    pickMultipleFromGallery,
    requestCameraPermission,
    requestGalleryPermission,
  };
}
