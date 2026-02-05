/**
 * POA Mobile App
 * Point-of-Accident KFZ-Schadenmanagement
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigation } from '@/navigation';
import { useAuthStore, useNetworkStore } from '@/stores';

// Create a client - aligned with web app settings for consistency
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (reduced from 30 to match web for memory efficiency)
    },
  },
});

function AppContent() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const initializeNetwork = useNetworkStore((state) => state.initialize);
  const cleanupNetwork = useNetworkStore((state) => state.cleanup);

  useEffect(() => {
    // Check authentication on app start
    checkAuth();

    // Initialize network listener
    initializeNetwork();

    return () => {
      cleanupNetwork();
    };
  }, [checkAuth, initializeNetwork, cleanupNetwork]);

  return (
    <>
      <StatusBar style="auto" />
      <Navigation />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
