/**
 * Notifications API Service
 * Benachrichtigungs-Endpoints
 */

import { apiClient } from './client';

// Types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: {
    claimId?: string;
    [key: string]: unknown;
  } | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
}

/**
 * Alle Notifications abrufen
 */
export const getAll = async (): Promise<NotificationsResponse> => {
  const response = await apiClient.get<NotificationsResponse>('/notifications');
  return response.data;
};

/**
 * Ungelesene Anzahl abrufen
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await getAll();
  return response.unreadCount;
};

/**
 * Notification als gelesen markieren
 */
export const markAsRead = async (id: string): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`);
};

/**
 * Alle als gelesen markieren
 */
export const markAllAsRead = async (): Promise<void> => {
  await apiClient.post('/notifications/read-all');
};

// Export all notifications functions
export const notificationsApi = {
  getAll,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
