/**
 * Auth Store
 * Zustand Store fuer Authentifizierung (identisches Pattern wie Web-App)
 */

import { create } from 'zustand';
import { authApi } from '@/services/api';
import { getAccessToken, clearTokens } from '@/services/storage';

// Types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string | null;
  phone: string | null;
  position: string | null;
  isActive: boolean;
}

interface Company {
  id: string;
  name: string;
  address: string | null;
}

interface AuthState {
  // State
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => void; // Demo-Login ohne API
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null, company: Company | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial State
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  // Login
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ email, password });
      set({
        user: response.user,
        company: response.company,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Demo-Login (ohne Backend)
  loginDemo: () => {
    const demoUser: User = {
      id: 'demo-user-123',
      email: 'max.mustermann@demo-firma.de',
      firstName: 'Max',
      lastName: 'Mustermann',
      role: 'EMPLOYEE',
      companyId: 'demo-company-123',
      phone: '+49 170 1234567',
      position: 'Fahrer',
      isActive: true,
    };
    const demoCompany: Company = {
      id: 'demo-company-123',
      name: 'Demo Spedition GmbH',
      address: 'Musterstraße 123, 12345 Berlin',
    };
    set({
      user: demoUser,
      company: demoCompany,
      isAuthenticated: true,
      isInitialized: true,
    });
  },

  // Logout
  logout: async () => {
    await clearTokens();
    set({
      user: null,
      company: null,
      isAuthenticated: false,
    });
  },

  // Check Auth (beim App-Start)
  // NON-BLOCKING: Does not set isLoading: true to prevent UI blocking
  checkAuth: async () => {
    let token: string | null = null;

    try {
      token = await getAccessToken();
    } catch (storageError) {
      // AsyncStorage error - log and continue without auth
      console.warn('[Auth] Storage error during checkAuth:', storageError);
      set({
        isInitialized: true,
        isAuthenticated: false,
        user: null,
        company: null,
      });
      return;
    }

    if (!token) {
      set({
        isInitialized: true,
        isAuthenticated: false,
        user: null,
        company: null,
      });
      return;
    }

    // NON-BLOCKING: Set isInitialized immediately so UI can render
    // isLoading stays false to prevent blocking spinner
    set({ isInitialized: true });

    try {
      const response = await authApi.getProfile();
      set({
        user: response.user,
        company: response.company,
        isAuthenticated: true,
      });
    } catch {
      // Token ungueltig -> ausloggen
      try {
        await clearTokens();
      } catch (clearError) {
        console.warn('[Auth] Error clearing tokens:', clearError);
      }
      set({
        user: null,
        company: null,
        isAuthenticated: false,
      });
    }
  },

  // Set User (fuer Updates)
  setUser: (user, company) => {
    set({
      user,
      company,
      isAuthenticated: !!user,
    });
  },

  // Clear Auth (fuer Token-Fehler)
  clearAuth: () => {
    set({
      user: null,
      company: null,
      isAuthenticated: false,
    });
  },
}));

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectCompany = (state: AuthState) => state.company;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;

// Helper: User Full Name
export const getUserFullName = (user: User | null): string => {
  if (!user) return '';
  return `${user.firstName} ${user.lastName}`.trim();
};

// Helper: User Initials
export const getUserInitials = (user: User | null): string => {
  if (!user) return '';
  const first = user.firstName?.[0] || '';
  const last = user.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase();
};
