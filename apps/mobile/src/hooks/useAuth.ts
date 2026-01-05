/**
 * useAuth Hook
 * Wrapper für AuthStore mit zusätzlichen Hilfsfunktionen
 */

import { useCallback } from 'react';
import {
  useAuthStore,
  selectUser,
  selectCompany,
  selectIsAuthenticated,
  selectIsLoading,
  selectIsInitialized,
  getUserFullName,
  getUserInitials,
} from '../stores/authStore';

export function useAuth() {
  const user = useAuthStore(selectUser);
  const company = useAuthStore(selectCompany);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);
  const isInitialized = useAuthStore(selectIsInitialized);

  const login = useAuthStore((state) => state.login);
  const loginDemo = useAuthStore((state) => state.loginDemo);
  const logout = useAuthStore((state) => state.logout);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      await login(email, password);
    },
    [login]
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleDemoLogin = useCallback(() => {
    loginDemo();
  }, [loginDemo]);

  return {
    // State
    user,
    company,
    isAuthenticated,
    isLoading,
    isInitialized,

    // Derived
    fullName: getUserFullName(user),
    initials: getUserInitials(user),
    isEmployee: user?.role === 'EMPLOYEE',
    isAdmin: user?.role === 'ADMIN',
    isFleetManager: user?.role === 'FLEET_MANAGER',
    isBroker: user?.role === 'BROKER',

    // Actions
    login: handleLogin,
    loginDemo: handleDemoLogin,
    logout: handleLogout,
    checkAuth,
  };
}
