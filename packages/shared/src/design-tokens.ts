/**
 * POA Design Tokens
 * Shared color system for Web (HSL) and Mobile (HEX)
 *
 * This file provides a single source of truth for all design tokens
 * across the web and mobile applications.
 */

// ============================================
// PRIMARY COLORS
// ============================================
// Navy/Indigo - POA Brand Color
export const colors = {
  primary: {
    hsl: '245 58% 20%',
    hex: '#1e1b4b',
    // Shades for gradients and variations
    50: { hsl: '245 100% 97%', hex: '#eef2ff' },
    100: { hsl: '245 100% 94%', hex: '#e0e7ff' },
    200: { hsl: '245 97% 87%', hex: '#c7d2fe' },
    300: { hsl: '245 95% 76%', hex: '#a5b4fc' },
    400: { hsl: '245 92% 64%', hex: '#818cf8' },
    500: { hsl: '245 91% 59%', hex: '#6366f1' },
    600: { hsl: '245 84% 50%', hex: '#4f46e5' },
    700: { hsl: '245 75% 42%', hex: '#4338ca' },
    800: { hsl: '245 58% 20%', hex: '#1e1b4b' }, // Main brand color
    900: { hsl: '245 61% 18%', hex: '#1e1b4b' },
  },

  // Gray Scale
  gray: {
    50: { hsl: '210 20% 98%', hex: '#f9fafb' },
    100: { hsl: '220 14% 96%', hex: '#f3f4f6' },
    200: { hsl: '220 13% 91%', hex: '#e5e7eb' },
    300: { hsl: '216 12% 84%', hex: '#d1d5db' },
    400: { hsl: '218 11% 65%', hex: '#9ca3af' },
    500: { hsl: '220 9% 46%', hex: '#6b7280' },
    600: { hsl: '215 14% 34%', hex: '#4b5563' },
    700: { hsl: '217 19% 27%', hex: '#374151' },
    800: { hsl: '215 28% 17%', hex: '#1f2937' },
    900: { hsl: '221 39% 11%', hex: '#111827' },
  },

  // Success (Green)
  success: {
    50: { hsl: '138 76% 97%', hex: '#f0fdf4' },
    100: { hsl: '141 84% 93%', hex: '#dcfce7' },
    500: { hsl: '142 71% 45%', hex: '#22c55e' },
    600: { hsl: '142 76% 36%', hex: '#16a34a' },
    700: { hsl: '142 72% 29%', hex: '#15803d' },
  },

  // Warning (Amber)
  warning: {
    50: { hsl: '48 100% 96%', hex: '#fffbeb' },
    100: { hsl: '48 96% 89%', hex: '#fef3c7' },
    500: { hsl: '38 92% 50%', hex: '#f59e0b' },
    600: { hsl: '32 95% 44%', hex: '#d97706' },
    700: { hsl: '26 90% 37%', hex: '#b45309' },
  },

  // Error (Red)
  error: {
    50: { hsl: '0 86% 97%', hex: '#fef2f2' },
    100: { hsl: '0 93% 94%', hex: '#fee2e2' },
    400: { hsl: '0 91% 71%', hex: '#f87171' },
    500: { hsl: '0 84% 60%', hex: '#ef4444' },
    600: { hsl: '0 72% 51%', hex: '#dc2626' },
    700: { hsl: '0 74% 42%', hex: '#b91c1c' },
  },

  // Info (Blue)
  info: {
    50: { hsl: '214 100% 97%', hex: '#eff6ff' },
    100: { hsl: '214 95% 93%', hex: '#dbeafe' },
    500: { hsl: '217 91% 60%', hex: '#3b82f6' },
    600: { hsl: '221 83% 53%', hex: '#2563eb' },
  },

  // Base colors
  white: { hsl: '0 0% 100%', hex: '#ffffff' },
  black: { hsl: '0 0% 0%', hex: '#000000' },
};

// ============================================
// CLAIM STATUS COLORS
// ============================================
// These colors are used consistently across web and mobile for claim status badges
export const claimStatusColors = {
  DRAFT: {
    bg: { hsl: '220 14% 96%', hex: '#f3f4f6' },
    text: { hsl: '217 19% 27%', hex: '#374151' },
    border: { hsl: '216 12% 84%', hex: '#d1d5db' },
  },
  SUBMITTED: {
    bg: { hsl: '245 100% 94%', hex: '#e0e7ff' },
    text: { hsl: '245 75% 42%', hex: '#4338ca' },
    border: { hsl: '245 95% 76%', hex: '#a5b4fc' },
  },
  APPROVED: {
    bg: { hsl: '141 84% 93%', hex: '#dcfce7' },
    text: { hsl: '142 72% 29%', hex: '#15803d' },
    border: { hsl: '142 71% 45%', hex: '#22c55e' },
  },
  SENT: {
    bg: { hsl: '214 95% 93%', hex: '#dbeafe' },
    text: { hsl: '221 83% 53%', hex: '#2563eb' },
    border: { hsl: '217 91% 60%', hex: '#3b82f6' },
  },
  ACKNOWLEDGED: {
    bg: { hsl: '138 76% 97%', hex: '#f0fdf4' },
    text: { hsl: '142 76% 36%', hex: '#16a34a' },
    border: { hsl: '142 71% 45%', hex: '#22c55e' },
  },
  CLOSED: {
    bg: { hsl: '220 14% 96%', hex: '#f3f4f6' },
    text: { hsl: '215 14% 34%', hex: '#4b5563' },
    border: { hsl: '218 11% 65%', hex: '#9ca3af' },
  },
  REJECTED: {
    bg: { hsl: '0 93% 94%', hex: '#fee2e2' },
    text: { hsl: '0 74% 42%', hex: '#b91c1c' },
    border: { hsl: '0 84% 60%', hex: '#ef4444' },
  },
};

// ============================================
// DAMAGE CATEGORY COLORS
// ============================================
export const damageCategoryColors = {
  LIABILITY: { hsl: '0 84% 60%', hex: '#ef4444' },
  COMPREHENSIVE: { hsl: '245 91% 59%', hex: '#6366f1' },
  GLASS: { hsl: '217 91% 60%', hex: '#3b82f6' },
  WILDLIFE: { hsl: '38 92% 50%', hex: '#f59e0b' },
  PARKING: { hsl: '220 9% 46%', hex: '#6b7280' },
  THEFT: { hsl: '0 72% 51%', hex: '#dc2626' },
  VANDALISM: { hsl: '0 91% 71%', hex: '#f87171' },
  OTHER: { hsl: '218 11% 65%', hex: '#9ca3af' },
};

// ============================================
// SPACING
// ============================================
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ============================================
// TYPOGRAPHY
// ============================================
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
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get HEX color for mobile usage
 */
export function getHexColor(colorPath: string): string {
  const parts = colorPath.split('.');
  let current: Record<string, unknown> = colors as Record<string, unknown>;

  for (const part of parts) {
    if (current[part] === undefined) {
      console.warn(`Color path not found: ${colorPath}`);
      return '#000000';
    }
    current = current[part] as Record<string, unknown>;
  }

  if (typeof current === 'object' && 'hex' in current) {
    return current.hex as string;
  }

  return '#000000';
}

/**
 * Get HSL color for web CSS variables
 */
export function getHslColor(colorPath: string): string {
  const parts = colorPath.split('.');
  let current: Record<string, unknown> = colors as Record<string, unknown>;

  for (const part of parts) {
    if (current[part] === undefined) {
      console.warn(`Color path not found: ${colorPath}`);
      return '0 0% 0%';
    }
    current = current[part] as Record<string, unknown>;
  }

  if (typeof current === 'object' && 'hsl' in current) {
    return current.hsl as string;
  }

  return '0 0% 0%';
}
