/**
 * POA Mobile App - Theme Constants
 * Farben, Spacing, Typography, etc.
 *
 * NOTE: Colors are aligned with web app (see packages/shared/src/design-tokens.ts)
 */

export const colors = {
  // Primary Navy/Indigo (POA Brand - matches web app)
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#1e1b4b', // Main brand color (matches web --primary: 245 58% 20%)
    900: '#1e1b4b',
  },
  // Gray Scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Success
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  // Warning
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  // Error
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  // Info
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
  },
  // Base
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  // Background
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },
  // Text
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
  },
  // Border
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Claim Status Colors
export const claimStatusColors: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: colors.gray[100], text: colors.gray[700], border: colors.gray[300] },
  SUBMITTED: { bg: colors.primary[100], text: colors.primary[700], border: colors.primary[300] },
  APPROVED: { bg: colors.success[100], text: colors.success[700], border: colors.success[500] },
  SENT: { bg: colors.info[100], text: colors.info[600], border: colors.info[500] },
  ACKNOWLEDGED: { bg: colors.success[50], text: colors.success[600], border: colors.success[500] },
  CLOSED: { bg: colors.gray[100], text: colors.gray[600], border: colors.gray[400] },
  REJECTED: { bg: colors.error[100], text: colors.error[700], border: colors.error[500] },
};

// Damage Category Colors
export const damageCategoryColors: Record<string, string> = {
  LIABILITY: colors.error[500],
  COMPREHENSIVE: colors.primary[500],
  GLASS: colors.info[500],
  WILDLIFE: colors.warning[500],
  PARKING: colors.gray[500],
  THEFT: colors.error[600],
  VANDALISM: colors.error[400],
  OTHER: colors.gray[400],
};
