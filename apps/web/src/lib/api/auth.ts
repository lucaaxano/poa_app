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

export interface AcceptInvitationData {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

// Auth API functions
export const authApi = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    const { tokens } = response.data;
    setTokens(tokens.accessToken, tokens.refreshToken);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    const { tokens } = response.data;
    setTokens(tokens.accessToken, tokens.refreshToken);
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
