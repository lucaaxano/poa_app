'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usersApi,
  NotificationSettings,
  UpdateNotificationSettingsInput,
} from '@/lib/api/users';

// Query key
const SETTINGS_KEY = ['notification-settings'] as const;

/**
 * Hook to fetch notification settings
 */
export function useNotificationSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => usersApi.getNotificationSettings(),
  });
}

/**
 * Hook to update notification settings
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateNotificationSettingsInput) =>
      usersApi.updateNotificationSettings(data),
    onSuccess: (data) => {
      // Update the cache with the new settings
      queryClient.setQueryData(SETTINGS_KEY, data);
    },
  });
}
