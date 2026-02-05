/**
 * Profile Screen
 * Benutzerprofi und Einstellungen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, getUserFullName, getUserInitials } from '@/stores';
import { colors, spacing, fontSize, borderRadius, fontWeight, shadow } from '@/constants/theme';
import { APP_INFO } from '@/constants/config';
import type { ProfileScreenProps } from '@/navigation/types';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showArrow?: boolean;
  value?: string;
}

export function ProfileScreen({ navigation }: ProfileScreenProps<'ProfileMain'>) {
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'key-outline',
      label: 'Passwort ändern',
      onPress: () => navigation.navigate('ChangePassword'),
      showArrow: true,
    },
    {
      icon: 'notifications-outline',
      label: 'Benachrichtigungen',
      onPress: () => navigation.navigate('NotificationSettings'),
      showArrow: true,
    },
    {
      icon: 'information-circle-outline',
      label: 'App Version',
      onPress: () => {},
      value: APP_INFO.VERSION,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getUserInitials(user)}
            </Text>
          </View>
          <Text style={styles.userName}>{getUserFullName(user) || 'Benutzer'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          {company && (
            <View style={styles.companyBadge}>
              <Ionicons name="business-outline" size={14} color={colors.primary[600]} />
              <Text style={styles.companyName}>{company.name}</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === 0 && styles.menuItemFirst,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}
              disabled={!item.showArrow && !item.onPress}
            >
              <Ionicons name={item.icon} size={22} color={colors.text.secondary} />
              <Text style={styles.menuItemLabel}>{item.label}</Text>
              {item.value ? (
                <Text style={styles.menuItemValue}>{item.value}</Text>
              ) : item.showArrow ? (
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.error[600]} />
          <Text style={styles.logoutText}>Abmelden</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            POA - Point-of-Accident
          </Text>
          <Text style={styles.footerSubtext}>
            KFZ-Schadenmanagement
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  companyName: {
    fontSize: fontSize.sm,
    color: colors.primary[700],
    marginLeft: spacing.xs,
  },
  menuSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuItemFirst: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  menuItemLast: {
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    borderBottomWidth: 0,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  menuItemValue: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  logoutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.error[600],
    marginLeft: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  footerSubtext: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});
