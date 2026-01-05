/**
 * Main Navigator
 * Bottom Tab Navigator fuer authentifizierte Screens
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { NotificationsScreen } from '@/screens/notifications/NotificationsScreen';
import { ClaimsNavigator } from './ClaimsNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { useNotificationStore } from '@/stores';
import { colors, spacing, fontSize } from '@/constants/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Icon mapping
type IconName = keyof typeof Ionicons.glyphMap;

const getTabIcon = (routeName: keyof MainTabParamList, focused: boolean): IconName => {
  const icons: Record<keyof MainTabParamList, { active: IconName; inactive: IconName }> = {
    Dashboard: { active: 'home', inactive: 'home-outline' },
    Claims: { active: 'document-text', inactive: 'document-text-outline' },
    Notifications: { active: 'notifications', inactive: 'notifications-outline' },
    Profile: { active: 'person', inactive: 'person-outline' },
  };
  return focused ? icons[routeName].active : icons[routeName].inactive;
};

export function MainNavigator() {
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabIcon(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[500],
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '500',
        },
        tabBarStyle: {
          paddingBottom: spacing.sm,
          paddingTop: spacing.sm,
          height: 60,
          borderTopColor: colors.border.light,
          borderTopWidth: 1,
        },
        headerStyle: { backgroundColor: colors.primary[800] },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Uebersicht' }}
      />
      <Tab.Screen
        name="Claims"
        component={ClaimsNavigator}
        options={{
          title: 'Schaeden',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Meldungen',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.error[500],
            fontSize: 10,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          title: 'Profil',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}
