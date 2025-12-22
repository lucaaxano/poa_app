import { apiClient } from './client';

// Types
export type NotificationType =
  | 'NEW_CLAIM'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'CLAIM_SENT'
  | 'NEW_COMMENT'
  | 'INVITATION'
  | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: {
    claimId?: string;
    claimNumber?: string;
    [key: string]: unknown;
  } | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  count: number;
}

// Notifications API functions
export const notificationsApi = {
  /**
   * Get all notifications for the current user (paginated)
   */
  async getAll(filters?: NotificationFilters): Promise<PaginatedNotifications> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.unreadOnly !== undefined) params.append('unreadOnly', String(filters.unreadOnly));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get<PaginatedNotifications>('/notifications', { params });
    return response.data;
  },

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data.count;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    const response = await apiClient.post<{ success: boolean; count: number }>('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};
