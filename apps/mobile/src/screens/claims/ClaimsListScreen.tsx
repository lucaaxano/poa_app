/**
 * Claims List Screen
 * Liste aller eigenen Schäden
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '@/constants/theme';
import type { ClaimsScreenProps } from '@/navigation/types';

export function ClaimsListScreen({ navigation }: ClaimsScreenProps<'ClaimsList'>) {
  const handleNewClaim = () => {
    navigation.navigate('NewClaim');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={64} color={colors.gray[300]} />
        <Text style={styles.emptyText}>Keine Schäden vorhanden</Text>
        <Text style={styles.emptySubtext}>
          Melden Sie Ihren ersten Schaden
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleNewClaim}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.buttonText}>Neuer Schaden</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginLeft: spacing.xs,
  },
});
