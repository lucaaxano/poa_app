/**
 * Dashboard Screen
 * Employee-Übersicht mit Stats und Quick Actions
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, getUserFullName } from '@/stores';
import { colors, spacing, fontSize, borderRadius, fontWeight, shadow } from '@/constants/theme';
import type { MainTabScreenProps } from '@/navigation/types';

export function DashboardScreen({ navigation }: MainTabScreenProps<'Dashboard'>) {
  const user = useAuthStore((state) => state.user);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // TODO: Refresh claims data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleNewClaim = () => {
    navigation.navigate('Claims', { screen: 'NewClaim' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Hallo, {getUserFullName(user) || 'Benutzer'}!
          </Text>
          <Text style={styles.welcomeSubtext}>
            Willkommen bei POA
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Meine Schäden</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.warning[600] }]}>0</Text>
            <Text style={styles.statLabel}>Offen</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success[600] }]}>0</Text>
            <Text style={styles.statLabel}>Abgeschlossen</Text>
          </View>
        </View>

        {/* Quick Action */}
        <TouchableOpacity style={styles.quickAction} onPress={handleNewClaim}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="add-circle" size={32} color={colors.white} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Neuen Schaden melden</Text>
            <Text style={styles.quickActionSubtitle}>Unfall oder Schaden dokumentieren</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>

        {/* Recent Claims */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Letzte Schäden</Text>
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>Keine Schäden vorhanden</Text>
            <Text style={styles.emptySubtext}>
              Melden Sie Ihren ersten Schaden über den Button oben.
            </Text>
          </View>
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
  welcomeSection: {
    marginBottom: spacing.lg,
  },
  welcomeText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  welcomeSubtext: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  quickAction: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  quickActionIcon: {
    marginRight: spacing.md,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  quickActionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.primary[100],
    marginTop: 2,
  },
  recentSection: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.sm,
  },
  emptyText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
