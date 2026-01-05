/**
 * Loading Screen
 * Wird angezeigt waehrend Auth-Check laeuft
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, spacing, fontSize } from '@/constants/theme';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
      <Text style={styles.text}>Laden...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  text: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
});
