import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../constants/theme';
import { ClaimStatusBadge } from './ClaimStatusBadge';

export interface ClaimCardData {
  id: string;
  claimNumber: string;
  status: string;
  accidentDate: string;
  accidentLocation: string | null;
  damageCategory: string;
  vehicle: {
    licensePlate: string;
    brand: string | null;
    model: string | null;
  };
}

interface ClaimCardProps {
  claim: ClaimCardData;
  onPress: () => void;
  testID?: string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getDamageCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    LIABILITY: 'Haftpflicht',
    COMPREHENSIVE: 'Vollkasko',
    GLASS: 'Glasschaden',
    WILDLIFE: 'Wildschaden',
    PARKING: 'Parkschaden',
    THEFT: 'Diebstahl',
    VANDALISM: 'Vandalismus',
    OTHER: 'Sonstiges',
  };
  return labels[category] || category;
};

export function ClaimCard({ claim, onPress, testID }: ClaimCardProps) {
  const vehicleDisplay = claim.vehicle.brand && claim.vehicle.model
    ? `${claim.vehicle.brand} ${claim.vehicle.model}`
    : claim.vehicle.licensePlate;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      <View style={styles.header}>
        <View style={styles.claimInfo}>
          <Text style={styles.claimNumber}>{claim.claimNumber}</Text>
          <ClaimStatusBadge status={claim.status} size="sm" />
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={16} color={colors.gray[500]} />
          <Text style={styles.detailText} numberOfLines={1}>
            {claim.vehicle.licensePlate}
            {vehicleDisplay !== claim.vehicle.licensePlate && ` - ${vehicleDisplay}`}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.gray[500]} />
          <Text style={styles.detailText}>{formatDate(claim.accidentDate)}</Text>
        </View>

        {claim.accidentLocation && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.gray[500]} />
            <Text style={styles.detailText} numberOfLines={1}>
              {claim.accidentLocation}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="shield-outline" size={16} color={colors.gray[500]} />
          <Text style={styles.detailText}>
            {getDamageCategoryLabel(claim.damageCategory)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  claimInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  claimNumber: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  details: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
});
