/**
 * Claim Draft Store
 * Speichert Schadensmeldungs-Daten zwischen Screens
 */

import { create } from 'zustand';

export interface ClaimDraftVehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
}

export interface ClaimDraftPhoto {
  id: string;
  uri: string;
  type: 'camera' | 'gallery';
  timestamp: string;
}

export interface ClaimDraftData {
  // Step 1: Grunddaten
  vehicle: ClaimDraftVehicle | null;
  accidentDate: string | null; // ISO string
  accidentTime: string | null; // ISO string
  location: string;
  gpsCoords: { lat: number; lng: number } | null;
  category: string;
  description: string;

  // Step 2: Fotos
  photos: ClaimDraftPhoto[];

  // Meta
  currentStep: number;
  isDirty: boolean;
}

interface ClaimDraftStore extends ClaimDraftData {
  // Step 1 Actions
  setVehicle: (vehicle: ClaimDraftVehicle | null) => void;
  setAccidentDate: (date: Date | null) => void;
  setAccidentTime: (time: Date | null) => void;
  setLocation: (location: string) => void;
  setGpsCoords: (coords: { lat: number; lng: number } | null) => void;
  setCategory: (category: string) => void;
  setDescription: (description: string) => void;

  // Step 2 Actions
  addPhoto: (photo: Omit<ClaimDraftPhoto, 'id' | 'timestamp'>) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;

  // Navigation
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Utility
  reset: () => void;
  isStep1Valid: () => boolean;
  isStep2Valid: () => boolean;
  getSubmitData: () => object;
}

const initialState: ClaimDraftData = {
  vehicle: null,
  accidentDate: null,
  accidentTime: null,
  location: '',
  gpsCoords: null,
  category: '',
  description: '',
  photos: [],
  currentStep: 1,
  isDirty: false,
};

export const useClaimDraftStore = create<ClaimDraftStore>((set, get) => ({
  ...initialState,

  // Step 1 Actions
  setVehicle: (vehicle) => set({ vehicle, isDirty: true }),

  setAccidentDate: (date) => set({
    accidentDate: date ? date.toISOString() : null,
    isDirty: true
  }),

  setAccidentTime: (time) => set({
    accidentTime: time ? time.toISOString() : null,
    isDirty: true
  }),

  setLocation: (location) => set({ location, isDirty: true }),

  setGpsCoords: (coords) => set({ gpsCoords: coords, isDirty: true }),

  setCategory: (category) => set({ category, isDirty: true }),

  setDescription: (description) => set({ description, isDirty: true }),

  // Step 2 Actions
  addPhoto: (photo) => set((state) => ({
    photos: [
      ...state.photos,
      {
        ...photo,
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      },
    ],
    isDirty: true,
  })),

  removePhoto: (id) => set((state) => ({
    photos: state.photos.filter((p) => p.id !== id),
    isDirty: true,
  })),

  clearPhotos: () => set({ photos: [], isDirty: true }),

  // Navigation
  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),

  // Utility
  reset: () => set(initialState),

  isStep1Valid: () => {
    const state = get();
    return !!(state.vehicle && state.accidentDate && state.category);
  },

  isStep2Valid: () => {
    // Fotos sind optional, aber mindestens 1 empfohlen
    return true;
  },

  getSubmitData: () => {
    const state = get();
    return {
      vehicleId: state.vehicle?.id,
      accidentDate: state.accidentDate,
      accidentTime: state.accidentTime,
      location: state.location,
      gpsCoords: state.gpsCoords,
      category: state.category,
      description: state.description,
      photoCount: state.photos.length,
    };
  },
}));
