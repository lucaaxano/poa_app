/**
 * Root Navigation
 * NavigationContainer mit Auth-basierter Navigation
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/stores';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { linking } from './linking';
import { LoadingScreen } from '@/screens/LoadingScreen';
import type { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function Navigation() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Zeige Loading Screen bis Auth-Check abgeschlossen
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// Re-export types
export * from './types';
export { linking, createDeepLink, createClaimDeepLink } from './linking';
