/**
 * Claims Navigator
 * Stack Navigator fuer Schaden-Screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClaimsListScreen } from '@/screens/claims/ClaimsListScreen';
import { ClaimDetailScreen } from '@/screens/claims/ClaimDetailScreen';
import { NewClaimScreen } from '@/screens/claims/NewClaimScreen';
import { ClaimPhotosScreen } from '@/screens/claims/ClaimPhotosScreen';
import { ClaimSummaryScreen } from '@/screens/claims/ClaimSummaryScreen';
import { colors } from '@/constants/theme';
import type { ClaimsStackParamList } from './types';

const ClaimsStack = createNativeStackNavigator<ClaimsStackParamList>();

export function ClaimsNavigator() {
  return (
    <ClaimsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary[800] },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <ClaimsStack.Screen
        name="ClaimsList"
        component={ClaimsListScreen}
        options={{ title: 'Meine Schaeden' }}
      />
      <ClaimsStack.Screen
        name="ClaimDetail"
        component={ClaimDetailScreen}
        options={{ title: 'Schadendetails' }}
      />
      <ClaimsStack.Screen
        name="NewClaim"
        component={NewClaimScreen}
        options={{ title: 'Neuer Schaden' }}
      />
      <ClaimsStack.Screen
        name="ClaimPhotos"
        component={ClaimPhotosScreen}
        options={{ title: 'Fotos hinzufuegen' }}
      />
      <ClaimsStack.Screen
        name="ClaimSummary"
        component={ClaimSummaryScreen}
        options={{ title: 'Zusammenfassung' }}
      />
    </ClaimsStack.Navigator>
  );
}
