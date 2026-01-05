/**
 * Network Store
 * Zustand Store fuer Netzwerk-Status
 */

import { create } from 'zustand';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

interface NetworkState {
  // State
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;

  // Internal
  _subscription: NetInfoSubscription | null;

  // Actions
  initialize: () => void;
  cleanup: () => void;
  setNetworkState: (state: NetInfoState) => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  // Initial State
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  _subscription: null,

  // Initialize Network Listener
  initialize: () => {
    // Cleanup existing subscription
    const existing = get()._subscription;
    if (existing) {
      existing();
    }

    // Subscribe to network changes
    const subscription = NetInfo.addEventListener((state: NetInfoState) => {
      get().setNetworkState(state);
    });

    set({ _subscription: subscription });

    // Get initial state
    NetInfo.fetch().then((state) => {
      get().setNetworkState(state);
    });
  },

  // Cleanup
  cleanup: () => {
    const subscription = get()._subscription;
    if (subscription) {
      subscription();
      set({ _subscription: null });
    }
  },

  // Set Network State
  setNetworkState: (state: NetInfoState) => {
    set({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
    });
  },
}));

// Selectors
export const selectIsConnected = (state: NetworkState) => state.isConnected;
export const selectIsInternetReachable = (state: NetworkState) => state.isInternetReachable;
export const selectIsOffline = (state: NetworkState) =>
  !state.isConnected || state.isInternetReachable === false;
