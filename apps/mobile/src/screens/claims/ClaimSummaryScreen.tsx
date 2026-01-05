/**
 * Claim Summary Screen
 * Zusammenfassung vor dem Absenden - Mit Store-Daten
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, fontWeight, shadow } from '@/constants/theme';
import { useClaimDraftStore } from '@/stores';
import type { ClaimsScreenProps } from '@/navigation/types';

// Category Labels
const CATEGORY_LABELS: Record<string, string> = {
  LIABILITY: 'Haftpflicht',
  COMPREHENSIVE: 'Vollkasko',
  GLASS: 'Glasschaden',
  PARKING: 'Parkschaden',
  THEFT: 'Diebstahl',
  OTHER: 'Sonstiges',
};

export function ClaimSummaryScreen({ navigation }: ClaimsScreenProps<'ClaimSummary'>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store State
  const {
    vehicle,
    accidentDate,
    accidentTime,
    location,
    gpsCoords,
    category,
    description,
    photos,
    reset,
  } = useClaimDraftStore();

  // Format Date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format Time
  const formatTime = (timeStr: string | null): string => {
    if (!timeStr) return '--';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Reset the draft store
      reset();

      Alert.alert(
        'Erfolg',
        'Ihr Schaden wurde erfolgreich gemeldet. Sie erhalten eine Bestätigung per E-Mail.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ClaimsList'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Fehler', 'Der Schaden konnte nicht gesendet werden. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (section: string) => {
    if (section === 'photos') {
      navigation.goBack();
    } else {
      // Go back to NewClaim screen
      navigation.navigate('NewClaim');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotCompleted]}>
              <Ionicons name="checkmark" size={8} color={colors.white} />
            </View>
            <Text style={styles.progressText}>Daten</Text>
          </View>
          <View style={[styles.progressLine, styles.progressLineCompleted]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotCompleted]}>
              <Ionicons name="checkmark" size={8} color={colors.white} />
            </View>
            <Text style={styles.progressText}>Fotos</Text>
          </View>
          <View style={[styles.progressLine, styles.progressLineCompleted]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <Text style={[styles.progressText, styles.progressTextActive]}>Prüfen</Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success[600]} />
          <Text style={styles.infoText}>
            Bitte prüfen Sie Ihre Angaben vor dem Absenden.
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
          {vehicle ? (
            <View style={styles.vehicleInfo}>
              <Ionicons name="car" size={24} color={colors.primary[600]} />
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
                <Text style={styles.vehicleModel}>{vehicle.brand} {vehicle.model}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.placeholderText}>Kein Fahrzeug ausgewählt</Text>
          )}
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
            <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>Datum:</Text>
            <Text style={styles.infoValue}>{formatDate(accidentDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>Uhrzeit:</Text>
            <Text style={styles.infoValue}>{formatTime(accidentTime)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>Ort:</Text>
            <Text style={styles.infoValue}>{location || '--'}</Text>
          </View>
          {gpsCoords && (
            <View style={styles.gpsInfo}>
              <Ionicons name="navigate" size={14} color={colors.text.tertiary} />
              <Text style={styles.gpsText}>
                GPS: {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
              </Text>
            </View>
          )}
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
            <Ionicons name="folder-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>Kategorie:</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {CATEGORY_LABELS[category] || category || '--'}
              </Text>
            </View>
          </View>
          <View style={styles.descriptionContainer}>
            <View style={styles.descriptionHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Beschreibung:</Text>
            </View>
            <Text style={[styles.descriptionText, !description && styles.placeholderText]}>
              {description || 'Keine Beschreibung angegeben'}
            </Text>
          </View>
        </View>

        {/* Fotos Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Fotos ({photos.length})</Text>
            <TouchableOpacity onPress={() => handleEdit('photos')}>
              <Text style={styles.editLink}>Bearbeiten</Text>
            </TouchableOpacity>
          </View>
          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
              {photos.map((photo) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.uri }}
                  style={styles.photoThumbnail}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.photosPlaceholder}>
              <Ionicons name="images-outline" size={32} color={colors.gray[300]} />
              <Text style={styles.placeholderText}>Keine Fotos hinzugefügt</Text>
            </View>
          )}
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

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text.secondary} />
          <Text style={styles.backButtonText}>Zurück</Text>
        </TouchableOpacity>
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
              <Text style={styles.submitButtonText}>Absenden</Text>
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
  // Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray[300],
    marginBottom: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: colors.primary[600],
  },
  progressDotCompleted: {
    backgroundColor: colors.success[600],
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray[300],
    marginHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  progressLineCompleted: {
    backgroundColor: colors.success[600],
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  progressTextActive: {
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
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
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetails: {
    marginLeft: spacing.md,
  },
  vehiclePlate: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  vehicleModel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  placeholderText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    width: 70,
  },
  infoValue: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  gpsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingLeft: spacing.xl + spacing.sm,
  },
  gpsText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: fontSize.sm,
    color: colors.primary[700],
    fontWeight: fontWeight.medium,
  },
  descriptionContainer: {
    marginTop: spacing.sm,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginLeft: spacing.xl + spacing.sm,
    lineHeight: 20,
  },
  photoList: {
    marginTop: spacing.sm,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
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
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  backButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  backButtonText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  submitButton: {
    flex: 2,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.success[600],
    borderRadius: borderRadius.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
});
