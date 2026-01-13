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

// Broker Request Types
export interface BrokerRequest {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  company: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  invitedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CompanyBroker {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isActive: boolean;
  linkedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    firstName: string;
    lastName: string;
  };
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
    // Try to notify server about logout (for cache invalidation)
    // Don't fail if this fails - we still want to clear local tokens
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors - logout should still succeed locally
    }
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

  // ==========================================
  // Broker Request Methods
  // ==========================================

  /**
   * Get pending broker requests (for Brokers)
   */
  async getBrokerRequests(): Promise<BrokerRequest[]> {
    const response = await apiClient.get<BrokerRequest[]>('/auth/broker-requests');
    return response.data;
  },

  /**
   * Accept a broker request (for Brokers)
   */
  async acceptBrokerRequest(requestId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `/auth/broker-requests/${requestId}/accept`
    );
    return response.data;
  },

  /**
   * Reject a broker request (for Brokers)
   */
  async rejectBrokerRequest(requestId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `/auth/broker-requests/${requestId}/reject`
    );
    return response.data;
  },

  /**
   * Get brokers linked to the company (for Company Admins)
   */
  async getCompanyBrokers(): Promise<CompanyBroker[]> {
    const response = await apiClient.get<CompanyBroker[]>('/auth/company-brokers');
    return response.data;
  },

  /**
   * Remove a broker from the company (for Company Admins)
   */
  async removeBroker(brokerId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/auth/company-brokers/${brokerId}`
    );
    return response.data;
  },

  /**
   * Invite a user (also used to invite brokers)
   */
  async inviteUser(email: string, role: 'EMPLOYEE' | 'BROKER' | 'COMPANY_ADMIN'): Promise<Invitation> {
    const response = await apiClient.post<Invitation>('/auth/invite', { email, role });
    return response.data;
  },

  /**
   * Get pending invitations for the company
   */
  async getInvitations(): Promise<Invitation[]> {
    const response = await apiClient.get<Invitation[]>('/auth/invitations');
    return response.data;
  },

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/auth/invitations/${invitationId}`
    );
    return response.data;
  },
};
