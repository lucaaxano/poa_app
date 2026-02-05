/**
 * useCreateClaim Hook
 * Claim erstellen mit mehrstufigem Workflow
 * Performance optimized with parallel photo uploads
 */

import { useState, useCallback } from 'react';
import { claimsApi, CreateClaimInput, ClaimDetail } from '../services/api/claims';

export interface ClaimDraft {
  vehicleId: string;
  accidentDate: Date | null;
  accidentTime: Date | null;
  accidentLocation: string;
  gpsLat: number | null;
  gpsLng: number | null;
  damageCategory: string;
  damageSubcategory: string;
  description: string;
  policeInvolved: boolean;
  policeFileNumber: string;
  hasInjuries: boolean;
  injuryDetails: string;
  photos: PhotoItem[];
}

export interface PhotoItem {
  id: string;
  uri: string;
  name: string;
  type: string;
}

const initialDraft: ClaimDraft = {
  vehicleId: '',
  accidentDate: null,
  accidentTime: null,
  accidentLocation: '',
  gpsLat: null,
  gpsLng: null,
  damageCategory: '',
  damageSubcategory: '',
  description: '',
  policeInvolved: false,
  policeFileNumber: '',
  hasInjuries: false,
  injuryDetails: '',
  photos: [],
};

interface UseCreateClaimReturn {
  draft: ClaimDraft;
  isSubmitting: boolean;
  error: string | null;
  updateDraft: (updates: Partial<ClaimDraft>) => void;
  addPhoto: (photo: PhotoItem) => void;
  removePhoto: (photoId: string) => void;
  resetDraft: () => void;
  saveDraft: () => Promise<ClaimDetail>;
  submitClaim: () => Promise<ClaimDetail>;
  validateStep: (step: number) => { isValid: boolean; errors: string[] };
}

export function useCreateClaim(): UseCreateClaimReturn {
  const [draft, setDraft] = useState<ClaimDraft>(initialDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDraft = useCallback((updates: Partial<ClaimDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  }, []);

  const addPhoto = useCallback((photo: PhotoItem) => {
    setDraft((prev) => ({
      ...prev,
      photos: [...prev.photos, photo],
    }));
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setDraft((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== photoId),
    }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(initialDraft);
    setError(null);
  }, []);

  const validateStep = useCallback(
    (step: number): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      switch (step) {
        case 1: // Basis-Informationen
          if (!draft.vehicleId) errors.push('Bitte wählen Sie ein Fahrzeug');
          if (!draft.accidentDate) errors.push('Bitte geben Sie das Unfalldatum an');
          if (!draft.damageCategory) errors.push('Bitte wählen Sie eine Schadenskategorie');
          break;

        case 2: // Fotos
          if (draft.photos.length < 1) errors.push('Bitte fügen Sie mindestens ein Foto hinzu');
          break;

        case 3: // Zusammenfassung
          // Alle vorherigen Validierungen
          if (!draft.vehicleId) errors.push('Fahrzeug fehlt');
          if (!draft.accidentDate) errors.push('Unfalldatum fehlt');
          if (!draft.damageCategory) errors.push('Schadenskategorie fehlt');
          break;
      }

      return { isValid: errors.length === 0, errors };
    },
    [draft]
  );

  const buildClaimInput = useCallback((): CreateClaimInput => {
    return {
      vehicleId: draft.vehicleId,
      accidentDate: draft.accidentDate?.toISOString().split('T')[0] || '',
      accidentTime: draft.accidentTime
        ? draft.accidentTime.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined,
      accidentLocation: draft.accidentLocation || undefined,
      gpsLat: draft.gpsLat || undefined,
      gpsLng: draft.gpsLng || undefined,
      damageCategory: draft.damageCategory,
      damageSubcategory: draft.damageSubcategory || undefined,
      description: draft.description || undefined,
      policeInvolved: draft.policeInvolved,
      policeFileNumber: draft.policeFileNumber || undefined,
      hasInjuries: draft.hasInjuries,
      injuryDetails: draft.injuryDetails || undefined,
    };
  }, [draft]);

  const saveDraft = useCallback(async (): Promise<ClaimDetail> => {
    try {
      setIsSubmitting(true);
      setError(null);

      const input = buildClaimInput();
      const claim = await claimsApi.create({ ...input, submitImmediately: false });

      // Upload photos in parallel for better performance
      if (draft.photos.length > 0) {
        await Promise.all(
          draft.photos.map((photo) =>
            claimsApi.uploadAttachment(claim.id, {
              uri: photo.uri,
              name: photo.name,
              type: photo.type,
            })
          )
        );
      }

      return claim;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Speichern des Entwurfs';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [buildClaimInput, draft.photos]);

  const submitClaim = useCallback(async (): Promise<ClaimDetail> => {
    try {
      setIsSubmitting(true);
      setError(null);

      const input = buildClaimInput();
      const claim = await claimsApi.create({ ...input, submitImmediately: true });

      // Upload photos in parallel for better performance
      if (draft.photos.length > 0) {
        await Promise.all(
          draft.photos.map((photo) =>
            claimsApi.uploadAttachment(claim.id, {
              uri: photo.uri,
              name: photo.name,
              type: photo.type,
            })
          )
        );
      }

      // Submit wenn noch nicht automatisch erfolgt
      if (claim.status === 'DRAFT') {
        return await claimsApi.submit(claim.id);
      }

      return claim;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Einreichen des Schadens';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [buildClaimInput, draft.photos]);

  return {
    draft,
    isSubmitting,
    error,
    updateDraft,
    addPhoto,
    removePhoto,
    resetDraft,
    saveDraft,
    submitClaim,
    validateStep,
  };
}
