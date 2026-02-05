/**
 * Claim Detail Screen
 * Detailansicht eines einzelnen Schadens
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, fontWeight, shadow } from '@/constants/theme';
import type { ClaimsScreenProps } from '@/navigation/types';

export function ClaimDetailScreen({ route, navigation }: ClaimsScreenProps<'ClaimDetail'>) {
  const { claimId } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: colors.warning[100] }]}>
            <Text style={[styles.statusText, { color: colors.warning[700] }]}>
              In Bearbeitung
            </Text>
          </View>
        </View>

        {/* Basis Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basis-Informationen</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Schadennummer</Text>
            <Text style={styles.infoValue}>{claimId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Datum</Text>
            <Text style={styles.infoValue}>--</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fahrzeug</Text>
            <Text style={styles.infoValue}>--</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kategorie</Text>
            <Text style={styles.infoValue}>--</Text>
          </View>
        </View>

        {/* Beschreibung Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Beschreibung</Text>
          <Text style={styles.description}>
            Keine Beschreibung vorhanden.
          </Text>
        </View>

        {/* Fotos Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fotos</Text>
          <View style={styles.emptyPhotos}>
            <Ionicons name="images-outline" size={32} color={colors.gray[300]} />
            <Text style={styles.emptyPhotosText}>Keine Fotos vorhanden</Text>
          </View>
        </View>

        {/* Timeline Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verlauf</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Schaden erstellt</Text>
              <Text style={styles.timelineDate}>--</Text>
            </View>
          </View>
        </View>

        {/* Kommentar Button */}
        <TouchableOpacity style={styles.commentButton}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.commentButtonText}>Kommentar hinzufügen</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  emptyPhotos: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyPhotosText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[600],
    marginRight: spacing.md,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  timelineDate: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[600],
    marginBottom: spacing.lg,
  },
  commentButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.primary[600],
    marginLeft: spacing.sm,
  },
});
