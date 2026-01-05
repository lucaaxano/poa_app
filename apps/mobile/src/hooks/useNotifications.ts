/**
 * useNotifications Hook
 * Benachrichtigungen laden und verwalten
 */

import { useState, useCallback, useEffect } from 'react';
import { notificationsApi, Notification } from '../services/api/notifications';
import { useNotificationStore } from '../stores/notificationStore';

interface UseNotificationsOptions {
  autoFetch?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { autoFetch = true } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { unreadCount, setUnreadCount, decrementUnreadCount, resetUnreadCount } = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationsApi.getAll();
      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Laden der Benachrichtigungen';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setUnreadCount]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await notificationsApi.markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        );
        decrementUnreadCount();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Fehler beim Markieren als gelesen';
        throw new Error(errorMessage);
      }
    },
    [decrementUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      resetUnreadCount();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Markieren aller als gelesen';
      throw new Error(errorMessage);
    }
  }, [resetUnreadCount]);

  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    error,
    fetch: fetchNotifications,
    refresh,
    markAsRead,
    markAllAsRead,
  };
}

/**
 * useUnreadCount Hook
 * Nur ungelesene Anzahl abrufen (für Badge)
 */
export function useUnreadCount() {
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Fehler stillschweigend ignorieren für Badge
    } finally {
      setIsLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    fetch();
    // Alle 30 Sekunden aktualisieren
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { unreadCount, isLoading, refresh: fetch };
}
