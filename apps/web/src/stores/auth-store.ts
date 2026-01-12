import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@poa/shared';
import { authApi, type Company, type LoginData, type RegisterData, requires2FA } from '@/lib/api/auth';
import { getAccessToken, clearTokens } from '@/lib/api/client';

// Broker-specific company type with stats
export interface BrokerCompany {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  totalClaims: number;
  totalVehicles: number;
  pendingClaims: number;
}

// 2FA state
interface TwoFactorState {
  requires2FA: boolean;
  tempToken: string | null;
  userId: string | null;
}

interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Two-Factor Authentication state
  twoFactor: TwoFactorState;

  // Broker-specific state
  linkedCompanies: BrokerCompany[] | null;
  activeCompany: BrokerCompany | null;

  // Actions
  login: (data: LoginData) => Promise<{ requires2FA: boolean }>;
  complete2FA: (token: string) => Promise<void>;
  complete2FAWithBackup: (backupCode: string) => Promise<void>;
  cancel2FA: () => void;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null, company: Company | null) => void;

  // Broker-specific actions
  setLinkedCompanies: (companies: BrokerCompany[]) => void;
  setActiveCompany: (company: BrokerCompany | null) => void;
  clearBrokerState: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      // Two-Factor Authentication state
      twoFactor: {
        requires2FA: false,
        tempToken: null,
        userId: null,
      },

      // Broker-specific state
      linkedCompanies: null,
      activeCompany: null,

      login: async (data: LoginData) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(data);

          // Check if 2FA is required
          if (requires2FA(response)) {
            set({
              isLoading: false,
              twoFactor: {
                requires2FA: true,
                tempToken: response.tempToken,
                userId: response.userId,
              },
            });
            return { requires2FA: true };
          }

          // Normal login (no 2FA)
          set({
            user: response.user,
            company: response.company,
            isAuthenticated: true,
            isLoading: false,
            twoFactor: { requires2FA: false, tempToken: null, userId: null },
            // Clear broker state on new login
            linkedCompanies: null,
            activeCompany: null,
          });
          return { requires2FA: false };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      complete2FA: async (token: string) => {
        const { twoFactor } = get();
        if (!twoFactor.tempToken) {
          throw new Error('Keine 2FA-Sitzung aktiv');
        }

        set({ isLoading: true });
        try {
          const response = await authApi.validate2FA(twoFactor.tempToken, token);
          set({
            user: response.user,
            company: response.company,
            isAuthenticated: true,
            isLoading: false,
            twoFactor: { requires2FA: false, tempToken: null, userId: null },
            linkedCompanies: null,
            activeCompany: null,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      complete2FAWithBackup: async (backupCode: string) => {
        const { twoFactor } = get();
        if (!twoFactor.tempToken) {
          throw new Error('Keine 2FA-Sitzung aktiv');
        }

        set({ isLoading: true });
        try {
          const response = await authApi.useBackupCode(twoFactor.tempToken, backupCode);
          set({
            user: response.user,
            company: response.company,
            isAuthenticated: true,
            isLoading: false,
            twoFactor: { requires2FA: false, tempToken: null, userId: null },
            linkedCompanies: null,
            activeCompany: null,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      cancel2FA: () => {
        set({
          twoFactor: { requires2FA: false, tempToken: null, userId: null },
        });
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          // Registration now requires email verification
          // User is not authenticated until they verify their email
          await authApi.register(data);
          set({ isLoading: false });
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
          linkedCompanies: null,
          activeCompany: null,
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
            linkedCompanies: null,
            activeCompany: null,
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

      // Broker-specific actions
      setLinkedCompanies: (companies: BrokerCompany[]) => {
        set({ linkedCompanies: companies });
      },

      setActiveCompany: (company: BrokerCompany | null) => {
        set({ activeCompany: company });
      },

      clearBrokerState: () => {
        set({
          linkedCompanies: null,
          activeCompany: null,
        });
      },
    }),
    {
      name: 'poa-auth-storage',
      partialize: (state) => ({
        // Only persist activeCompany for broker
        activeCompany: state.activeCompany,
      }),
    }
  )
);
