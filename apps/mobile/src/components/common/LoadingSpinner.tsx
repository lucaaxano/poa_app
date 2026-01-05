import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, fontSize } from '../../constants/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  message?: string;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 'large',
  color = colors.primary[600],
  fullScreen = false,
  message,
  style,
}: LoadingSpinnerProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, style]}>
        {content}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  message: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
