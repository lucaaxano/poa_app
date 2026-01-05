/**
 * Deep Linking Configuration
 * Ermoeglicht Navigation via URLs (z.B. poa://claims/123)
 */

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { RootStackParamList } from './types';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'poa://'],
  config: {
    screens: {
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Claims: {
            screens: {
              ClaimsList: 'claims',
              ClaimDetail: 'claims/:claimId',
              NewClaim: 'claims/new',
              ClaimPhotos: 'claims/photos',
              ClaimSummary: 'claims/summary',
            },
          },
          Notifications: 'notifications',
          Profile: {
            screens: {
              ProfileMain: 'profile',
              ChangePassword: 'profile/password',
              NotificationSettings: 'profile/notifications',
            },
          },
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          ForgotPassword: 'forgot-password',
        },
      },
    },
  },
};

/**
 * Helper: Deep Link URL erstellen
 */
export const createDeepLink = (path: string): string => {
  return Linking.createURL(path);
};

/**
 * Helper: Zu Claim navigieren via Deep Link
 */
export const createClaimDeepLink = (claimId: string): string => {
  return createDeepLink(`claims/${claimId}`);
};
