import { create } from 'zustand';
import type { User } from '@poa/shared';
import { authApi, type Company, type LoginData, type RegisterData } from '@/lib/api/auth';
import { getAccessToken, clearTokens } from '@/lib/api/client';

interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null, company: Company | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  login: async (data: LoginData) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(data);
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

  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(data);
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

  logout: async () => {
    await authApi.logout();
    set({
      user: null,
      company: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = getAccessToken();

    if (!token) {
      set({ isInitialized: true, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authApi.getProfile();
      set({
        user: response.user,
        company: response.company,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch {
      clearTokens();
      set({
        user: null,
        company: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  setUser: (user: User | null, company: Company | null) => {
    set({
      user,
      company,
      isAuthenticated: !!user,
    });
  },
}));
