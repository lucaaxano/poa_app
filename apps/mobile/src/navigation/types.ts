/**
 * Navigation Type Definitions
 * Type-safe Navigation fuer die gesamte App
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ============================================
// Auth Stack (unauthenticated)
// ============================================
export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

// ============================================
// Claims Stack (nested in Main Tabs)
// ============================================
export type ClaimsStackParamList = {
  ClaimsList: undefined;
  ClaimDetail: { claimId: string };
  NewClaim: undefined;
  ClaimPhotos: { draftId?: string };
  ClaimSummary: { draftId?: string };
};

// ============================================
// Profile Stack (nested in Main Tabs)
// ============================================
export type ProfileStackParamList = {
  ProfileMain: undefined;
  ChangePassword: undefined;
  NotificationSettings: undefined;
};

// ============================================
// Main Tab Navigator
// ============================================
export type MainTabParamList = {
  Dashboard: undefined;
  Claims: NavigatorScreenParams<ClaimsStackParamList>;
  Notifications: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// ============================================
// Root Navigator
// ============================================
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// ============================================
// Screen Props Types
// ============================================

// Auth Screens
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

// Claims Screens
export type ClaimsScreenProps<T extends keyof ClaimsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ClaimsStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

// Profile Screens
export type ProfileScreenProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

// Main Tab Screens
export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

// Root Stack Screens
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

// ============================================
// Declaration for useNavigation
// ============================================
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
