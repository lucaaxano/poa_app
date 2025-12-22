import { apiClient } from './client';
import type { User, UserRole, UpdateUserInput } from '@poa/shared';

// Types
export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  position: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: string;
  createdAt: string;
  invitedBy?: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface InviteUserInput {
  email: string;
  role: UserRole;
}

export interface UpdateUserRoleInput {
  role: UserRole;
}

// Notification Settings Types
export type DigestMode = 'instant' | 'daily' | 'none';

export interface EmailNotificationSettings {
  newClaim: boolean;
  claimApproved: boolean;
  claimRejected: boolean;
  newComment: boolean;
  invitation: boolean;
}

export interface NotificationSettings {
  email: EmailNotificationSettings;
  digestMode: DigestMode;
}

export interface UpdateNotificationSettingsInput {
  email?: Partial<EmailNotificationSettings>;
  digestMode?: DigestMode;
}

// Users API functions
export const usersApi = {
  async getAll(): Promise<UserListItem[]> {
    const response = await apiClient.get<UserListItem[]>('/users');
    return response.data;
  },

  async getById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  async updateRole(id: string, role: UserRole): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}/role`, { role });
    return response.data;
  },

  async deactivate(id: string): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}/deactivate`);
    return response.data;
  },

  async reactivate(id: string): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}/reactivate`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  // Notification Settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get<NotificationSettings>('/users/me/notification-settings');
    return response.data;
  },

  async updateNotificationSettings(data: UpdateNotificationSettingsInput): Promise<NotificationSettings> {
    const response = await apiClient.patch<NotificationSettings>('/users/me/notification-settings', data);
    return response.data;
  },
};

// Invitations API functions
export const invitationsApi = {
  async getAll(): Promise<Invitation[]> {
    const response = await apiClient.get<Invitation[]>('/auth/invitations');
    return response.data;
  },

  async create(data: InviteUserInput): Promise<Invitation> {
    const response = await apiClient.post<Invitation>('/auth/invite', data);
    return response.data;
  },

  async cancel(id: string): Promise<void> {
    await apiClient.delete(`/auth/invitations/${id}`);
  },

  async resend(id: string): Promise<Invitation> {
    const response = await apiClient.post<Invitation>(`/auth/invitations/${id}/resend`);
    return response.data;
  },
};
