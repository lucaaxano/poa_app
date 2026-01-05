import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadow } from '../../constants/theme';

type CardVariant = 'default' | 'elevated' | 'outlined';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

const paddingStyles: Record<CardPadding, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
  testID,
}: CardProps) {
  const containerStyle = [
    styles.container,
    { padding: paddingStyles[padding] },
    variant === 'elevated' ? styles.elevated : null,
    variant === 'outlined' ? styles.outlined : null,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadow.sm,
  },
  elevated: {
    ...shadow.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
});
