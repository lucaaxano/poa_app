import { apiClient, setTokens, clearTokens } from './client';
import type { User } from '@poa/shared';

// Types
export interface Company {
  id: string;
  name: string;
  address?: string | null;
  numEmployees?: number | null;
  numVehicles?: number | null;
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  company: Company | null;
  tokens: AuthTokens;
}

export interface TwoFactorRequiredResponse {
  requires2FA: true;
  tempToken: string;
  userId: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export type LoginResponse = AuthResponse | TwoFactorRequiredResponse;

// Type guard to check if 2FA is required
export function requires2FA(response: LoginResponse): response is TwoFactorRequiredResponse {
  return 'requires2FA' in response && response.requires2FA === true;
}

export interface ProfileResponse {
  user: User;
  company: Company | null;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  numVehicles?: number;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  requiresVerification: boolean;
}

export interface AcceptInvitationData {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

// Auth API functions
export const authApi = {
  /**
   * Login - may return either full auth response or 2FA required response
   */
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    // Only set tokens if login is complete (no 2FA required)
    if (!requires2FA(response.data)) {
      const { tokens } = response.data;
      setTokens(tokens.accessToken, tokens.refreshToken);
    }
    return response.data;
  },

  /**
   * Validate 2FA token to complete login
   */
  async validate2FA(tempToken: string, token: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/2fa/validate', {
      tempToken,
      token,
    });
    const { tokens } = response.data;
    setTokens(tokens.accessToken, tokens.refreshToken);
    return response.data;
  },

  /**
   * Use backup code to complete login
   */
  async useBackupCode(tempToken: string, backupCode: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/2fa/backup', {
      tempToken,
      backupCode,
    });
    const { tokens } = response.data;
    setTokens(tokens.accessToken, tokens.refreshToken);
    return response.data;
  },

  /**
   * Get 2FA setup (QR code and secret)
   */
  async get2FASetup(): Promise<TwoFactorSetupResponse> {
    const response = await apiClient.get<TwoFactorSetupResponse>('/auth/2fa/setup');
    return response.data;
  },

  /**
   * Enable 2FA after verifying token
   */
  async enable2FA(token: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/2fa/enable',
      { token }
    );
    return response.data;
  },

  /**
   * Disable 2FA
   */
  async disable2FA(password: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/2fa/disable',
      { password }
    );
    return response.data;
  },

  /**
   * Get 2FA status
   */
  async get2FAStatus(): Promise<{ twoFactorEnabled: boolean }> {
    const response = await apiClient.get<{ twoFactorEnabled: boolean }>('/auth/2fa/status');
    return response.data;
  },

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(): Promise<{ backupCodes: string[] }> {
    const response = await apiClient.post<{ backupCodes: string[] }>('/auth/2fa/backup-codes');
    return response.data;
  },

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/verify-email', { token });
    return response.data;
  },

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/resend-verification', { email });
    return response.data;
  },

  async logout(): Promise<void> {
    clearTokens();
  },

  async getProfile(): Promise<ProfileResponse> {
    const response = await apiClient.get<ProfileResponse>('/auth/me');
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  },

  async acceptInvitation(data: AcceptInvitationData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/accept-invitation', data);
    const { tokens } = response.data;
    setTokens(tokens.accessToken, tokens.refreshToken);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    const { tokens } = response.data;
    setTokens(tokens.accessToken, tokens.refreshToken);
    return response.data;
  },

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    position?: string;
  }): Promise<User> {
    const response = await apiClient.patch<User>('/users/me', data);
    return response.data;
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const response = await apiClient.patch<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
