import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

/**
 * Button component with variants aligned to web app
 * Web variants: default, destructive, outline, secondary, ghost, link
 * Mobile variants: primary (=default), secondary, outline, ghost, danger (=destructive), link
 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primary[600],
      borderWidth: 0,
    },
    text: {
      color: colors.white,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.gray[100],
      borderWidth: 0,
    },
    text: {
      color: colors.gray[700],
    },
  },
  outline: {
    container: {
      backgroundColor: colors.transparent,
      borderWidth: 1,
      borderColor: colors.primary[600],
    },
    text: {
      color: colors.primary[600],
    },
  },
  ghost: {
    container: {
      backgroundColor: colors.transparent,
      borderWidth: 0,
    },
    text: {
      color: colors.primary[600],
    },
  },
  danger: {
    container: {
      backgroundColor: colors.error[600],
      borderWidth: 0,
    },
    text: {
      color: colors.white,
    },
  },
  // Added for consistency with web app
  link: {
    container: {
      backgroundColor: colors.transparent,
      borderWidth: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    text: {
      color: colors.primary[600],
      textDecorationLine: 'underline',
    },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle; iconSize: number }> = {
  sm: {
    container: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    text: {
      fontSize: fontSize.sm,
    },
    iconSize: 16,
  },
  md: {
    container: {
      paddingVertical: spacing.md - 4,
      paddingHorizontal: spacing.lg,
    },
    text: {
      fontSize: fontSize.base,
    },
    iconSize: 20,
  },
  lg: {
    container: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    text: {
      fontSize: fontSize.lg,
    },
    iconSize: 24,
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const iconColor = variantStyle.text.color as string;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={sizeStyle.iconSize}
              color={iconColor}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              variantStyle.text,
              sizeStyle.text,
              isDisabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={sizeStyle.iconSize}
              color={iconColor}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  disabledText: {
    opacity: 0.7,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
