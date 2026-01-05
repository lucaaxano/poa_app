/**
 * Auth API Service
 * Authentifizierungs-Endpoints
 */

import { apiClient } from './client';
import { setTokens, clearTokens } from '@/services/storage';

// Types
interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string | null;
    phone: string | null;
    position: string | null;
    isActive: boolean;
  };
  company: {
    id: string;
    name: string;
    address: string | null;
  } | null;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface ProfileResponse {
  user: LoginResponse['user'];
  company: LoginResponse['company'];
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface ForgotPasswordInput {
  email: string;
}

interface ResetPasswordInput {
  token: string;
  password: string;
}

/**
 * Login mit Email und Passwort
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

  // Tokens speichern
  await setTokens(
    response.data.tokens.accessToken,
    response.data.tokens.refreshToken
  );

  return response.data;
};

/**
 * Logout - Tokens loeschen
 */
export const logout = async (): Promise<void> => {
  await clearTokens();
};

/**
 * Aktuelles Profil abrufen
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await apiClient.get<ProfileResponse>('/auth/me');
  return response.data;
};

/**
 * Passwort aendern
 */
export const changePassword = async (input: ChangePasswordInput): Promise<void> => {
  await apiClient.patch('/auth/change-password', input);
};

/**
 * Passwort vergessen - Reset Link anfordern
 */
export const forgotPassword = async (input: ForgotPasswordInput): Promise<void> => {
  await apiClient.post('/auth/forgot-password', input);
};

/**
 * Passwort zuruecksetzen mit Token
 */
export const resetPassword = async (input: ResetPasswordInput): Promise<void> => {
  await apiClient.post('/auth/reset-password', input);
};

/**
 * Token refresh (wird automatisch vom Interceptor aufgerufen)
 */
export const refreshToken = async (refreshTokenStr: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const response = await apiClient.post('/auth/refresh', {
    refreshToken: refreshTokenStr,
  });
  return response.data.tokens;
};

// Export all auth functions
export const authApi = {
  login,
  logout,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
};
