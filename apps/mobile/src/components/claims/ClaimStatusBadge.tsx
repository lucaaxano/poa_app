import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius, claimStatusColors } from '../../constants/theme';

type ClaimStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SENT' | 'ACKNOWLEDGED' | 'CLOSED' | 'REJECTED';
type BadgeSize = 'sm' | 'md' | 'lg';

interface ClaimStatusBadgeProps {
  status: string;
  size?: BadgeSize;
  showIcon?: boolean;
  style?: ViewStyle;
}

const statusLabels: Record<ClaimStatus, string> = {
  DRAFT: 'Entwurf',
  SUBMITTED: 'Eingereicht',
  APPROVED: 'Genehmigt',
  SENT: 'Gesendet',
  ACKNOWLEDGED: 'Bestätigt',
  CLOSED: 'Abgeschlossen',
  REJECTED: 'Abgelehnt',
};

const statusIcons: Record<ClaimStatus, keyof typeof Ionicons.glyphMap> = {
  DRAFT: 'document-outline',
  SUBMITTED: 'paper-plane-outline',
  APPROVED: 'checkmark-circle-outline',
  SENT: 'send-outline',
  ACKNOWLEDGED: 'checkmark-done-outline',
  CLOSED: 'archive-outline',
  REJECTED: 'close-circle-outline',
};

const sizeStyles: Record<BadgeSize, { container: ViewStyle; text: TextStyle; iconSize: number }> = {
  sm: {
    container: {
      paddingVertical: spacing.xs - 2,
      paddingHorizontal: spacing.sm,
    },
    text: {
      fontSize: fontSize.xs,
    },
    iconSize: 12,
  },
  md: {
    container: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm + 2,
    },
    text: {
      fontSize: fontSize.sm,
    },
    iconSize: 14,
  },
  lg: {
    container: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    text: {
      fontSize: fontSize.base,
    },
    iconSize: 16,
  },
};

export function ClaimStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  style,
}: ClaimStatusBadgeProps) {
  const statusKey = status as ClaimStatus;
  const statusColor = claimStatusColors[statusKey] || claimStatusColors.DRAFT;
  const label = statusLabels[statusKey] || status;
  const icon = statusIcons[statusKey] || 'help-outline';
  const sizeStyle = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        sizeStyle.container,
        {
          backgroundColor: statusColor.bg,
          borderColor: statusColor.border,
        },
        style,
      ]}
    >
      {showIcon && (
        <Ionicons
          name={icon}
          size={sizeStyle.iconSize}
          color={statusColor.text}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          sizeStyle.text,
          { color: statusColor.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    fontWeight: fontWeight.medium,
  },
});
