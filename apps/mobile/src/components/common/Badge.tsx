import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
  default: {
    container: {
      backgroundColor: colors.gray[100],
    },
    text: {
      color: colors.gray[700],
    },
  },
  success: {
    container: {
      backgroundColor: colors.success[100],
    },
    text: {
      color: colors.success[700],
    },
  },
  warning: {
    container: {
      backgroundColor: colors.warning[100],
    },
    text: {
      color: colors.warning[700],
    },
  },
  error: {
    container: {
      backgroundColor: colors.error[100],
    },
    text: {
      color: colors.error[700],
    },
  },
  info: {
    container: {
      backgroundColor: colors.info[100],
    },
    text: {
      color: colors.info[600],
    },
  },
  primary: {
    container: {
      backgroundColor: colors.primary[100],
    },
    text: {
      color: colors.primary[700],
    },
  },
};

const sizeStyles: Record<BadgeSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingVertical: spacing.xs - 2,
      paddingHorizontal: spacing.sm,
    },
    text: {
      fontSize: fontSize.xs,
    },
  },
  md: {
    container: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm + 2,
    },
    text: {
      fontSize: fontSize.sm,
    },
  },
};

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  style,
  textStyle,
}: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        variantStyle.container,
        sizeStyle.container,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variantStyle.text,
          sizeStyle.text,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },
  text: {
    fontWeight: fontWeight.medium,
  },
});
