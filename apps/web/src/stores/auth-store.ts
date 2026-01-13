import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@poa/shared';
import { authApi, type Company, type LoginData, type RegisterData, requires2FA } from '@/lib/api/auth';
import { getAccessToken, clearTokens, setLoggingOut, stopApiWarmup, getLoggingOut } from '@/lib/api/client';

// Track login timestamp to prevent race conditions after login
// Instead of a boolean flag, we use a timestamp which is more robust
let lastLoginTimestamp: number = 0;
const LOGIN_GRACE_PERIOD_MS = 3000; // 3 seconds grace period after login

/**
 * Check if a login just happened within the grace period
 */
const isWithinLoginGracePeriod = (): boolean => {
  return Date.now() - lastLoginTimestamp < LOGIN_GRACE_PERIOD_MS;
};

/**
 * Mark that a login just happened
 */
const markLoginComplete = (): void => {
  lastLoginTimestamp = Date.now();
};

/**
 * Reset login timestamp (e.g., on logout)
 */
const resetLoginTimestamp = (): void => {
  lastLoginTimestamp = 0;
};

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

          // Mark login timestamp to prevent race condition in checkAuth
          markLoginComplete();

          // Normal login (no 2FA)
          set({
            user: response.user,
            company: response.company,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true, // Mark as initialized to skip checkAuth API call
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
          // Mark login timestamp to prevent race condition in checkAuth
          markLoginComplete();
          set({
            user: response.user,
            company: response.company,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true, // Mark as initialized to skip checkAuth API call
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
          // Mark login timestamp to prevent race condition in checkAuth
          markLoginComplete();
          set({
            user: response.user,
            company: response.company,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true, // Mark as initialized to skip checkAuth API call
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
        // CRITICAL: Set logging out flag FIRST to prevent API calls from timing out
        setLoggingOut(true);

        try {
          // Stop API warmup to prevent background requests
          stopApiWarmup();

          // Reset login timestamp to prevent race conditions
          resetLoginTimestamp();

          // Clear tokens FIRST (synchronous)
          await authApi.logout();

          // Clear state - keep isInitialized TRUE so navigation works
          set({
            user: null,
            company: null,
            isAuthenticated: false,
            isLoading: false,
            linkedCompanies: null,
            activeCompany: null,
          });
        } finally {
          // ALWAYS re-enable API calls, even if an error occurred
          // This prevents the app from being stuck in a "logging out" state
          setLoggingOut(false);
        }
      },

      checkAuth: async () => {
        // Skip if currently logging out
        if (getLoggingOut()) {
          return;
        }

        const token = getAccessToken();
        const { user: cachedUser, isAuthenticated: wasAuthenticated, isInitialized: alreadyInitialized } = get();

        if (!token) {
          resetLoginTimestamp();
          set({ isInitialized: true, isAuthenticated: false, user: null, company: null });
          return;
        }

        // If within login grace period, skip verification entirely to prevent race condition
        // The login/2FA flow already validated the user and set up tokens
        if (isWithinLoginGracePeriod()) {
          set({ isInitialized: true });
          return;
        }

        // If already initialized with valid auth (e.g., just logged in), skip API call entirely
        if (alreadyInitialized && cachedUser && wasAuthenticated) {
          return;
        }

        // If we have cached auth data but not initialized, use cache immediately
        // and verify in background (for page refresh scenarios)
        if (cachedUser && wasAuthenticated) {
          set({ isInitialized: true });
          // Update in background without blocking - no artificial delay needed
          // The API client handles retries and warmup automatically
          authApi.getProfile().then((response) => {
            set({
              user: response.user,
              company: response.company,
              isAuthenticated: true,
            });
          }).catch(() => {
            // Only clear tokens if the error is an auth error (401/403)
            // Don't log out on network errors or server errors
            clearTokens();
            set({
              user: null,
              company: null,
              isAuthenticated: false,
              linkedCompanies: null,
              activeCompany: null,
            });
          });
          return;
        }

        // No cached data - show loading and fetch
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
        // Persist user and company for faster initial load
        user: state.user,
        company: state.company,
        isAuthenticated: state.isAuthenticated,
        // Only persist activeCompany for broker
        activeCompany: state.activeCompany,
      }),
      // Don't persist isInitialized - it should be false on fresh page load
      // so that checkAuth can verify the token on refresh
    }
  )
);
