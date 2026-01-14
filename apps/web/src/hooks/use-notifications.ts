'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, NotificationFilters } from '@/lib/api/notifications';
import { useAuthStore } from '@/stores/auth-store';

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters?: NotificationFilters) => [...notificationKeys.lists(), filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

/**
 * Hook to fetch notifications with pagination and filters
 */
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationsApi.getAll(filters),
  });
}

/**
 * Hook to fetch unread notification count
 * Polls every 60 seconds for updates (optimized for performance)
 * CRITICAL: Only polls when authenticated to prevent unnecessary API calls after logout
 */
export function useUnreadCount() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    // Only poll when authenticated - stops polling immediately on logout
    refetchInterval: isAuthenticated ? 60 * 1000 : false,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    // Only fetch when authenticated - prevents 401 errors after logout
    enabled: isAuthenticated,
  });
}

/**
 * Hook to mark a single notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      // Invalidate both lists and unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      // Invalidate both lists and unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      // Invalidate both lists and unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}
