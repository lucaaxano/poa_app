/**
 * Claim Summary Screen
 * Zusammenfassung vor dem Absenden
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, fontWeight, shadow } from '@/constants/theme';
import type { ClaimsScreenProps } from '@/navigation/types';

export function ClaimSummaryScreen({ navigation }: ClaimsScreenProps<'ClaimSummary'>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implement claim submission
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Alert.alert(
        'Erfolg',
        'Ihr Schaden wurde erfolgreich gemeldet.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ClaimsList'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Fehler', 'Der Schaden konnte nicht gesendet werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (section: string) => {
    if (section === 'photos') {
      navigation.goBack();
    } else {
      navigation.navigate('NewClaim');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success[600]} />
          <Text style={styles.infoText}>
            Bitte pruefen Sie Ihre Angaben vor dem Absenden.
          </Text>
        </View>

        {/* Fahrzeug Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Fahrzeug</Text>
            <TouchableOpacity onPress={() => handleEdit('vehicle')}>
              <Text style={styles.editLink}>Bearbeiten</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.placeholderText}>Kein Fahrzeug ausgewaehlt</Text>
        </View>

        {/* Datum & Ort Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Datum & Ort</Text>
            <TouchableOpacity onPress={() => handleEdit('datetime')}>
              <Text style={styles.editLink}>Bearbeiten</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Datum:</Text>
            <Text style={styles.infoValue}>--</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Uhrzeit:</Text>
            <Text style={styles.infoValue}>--</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ort:</Text>
            <Text style={styles.infoValue}>--</Text>
          </View>
        </View>

        {/* Kategorie & Beschreibung Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Schadensdetails</Text>
            <TouchableOpacity onPress={() => handleEdit('details')}>
              <Text style={styles.editLink}>Bearbeiten</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kategorie:</Text>
            <Text style={styles.infoValue}>--</Text>
          </View>
          <View style={styles.descriptionContainer}>
            <Text style={styles.infoLabel}>Beschreibung:</Text>
            <Text style={styles.descriptionText}>Keine Beschreibung</Text>
          </View>
        </View>

        {/* Fotos Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Fotos</Text>
            <TouchableOpacity onPress={() => handleEdit('photos')}>
              <Text style={styles.editLink}>Bearbeiten</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.photosPlaceholder}>
            <Ionicons name="images-outline" size={32} color={colors.gray[300]} />
            <Text style={styles.placeholderText}>Keine Fotos hinzugefuegt</Text>
          </View>
        </View>

        {/* Offline Info */}
        <View style={styles.offlineInfo}>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.text.tertiary} />
          <Text style={styles.offlineInfoText}>
            Der Schaden wird sofort gesendet wenn Sie online sind.
            Bei fehlender Verbindung wird er automatisch synchronisiert.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={colors.white} />
              <Text style={styles.submitButtonText}>Schaden melden</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.success[700],
    marginLeft: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  editLink: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  placeholderText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  descriptionContainer: {
    marginTop: spacing.xs,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  photosPlaceholder: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  offlineInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  offlineInfoText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  submitButton: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
});
