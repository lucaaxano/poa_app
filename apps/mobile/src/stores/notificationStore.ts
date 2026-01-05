/**
 * Notification Store
 * Zustand Store fuer In-App Benachrichtigungen
 */

import { create } from 'zustand';

interface NotificationState {
  // State
  unreadCount: number;

  // Actions
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  // Initial State
  unreadCount: 0,

  // Set count
  setUnreadCount: (count: number) => {
    set({ unreadCount: Math.max(0, count) });
  },

  // Increment (wenn neue Notification empfangen)
  incrementUnreadCount: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },

  // Decrement (wenn Notification gelesen)
  decrementUnreadCount: () => {
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
  },

  // Reset (wenn alle gelesen)
  resetUnreadCount: () => {
    set({ unreadCount: 0 });
  },
}));

// Selectors
export const selectUnreadCount = (state: NotificationState) => state.unreadCount;
export const selectHasUnread = (state: NotificationState) => state.unreadCount > 0;
