/**
 * Claim Photos Screen
 * Fotos zur Schadensmeldung hinzufügen - Mit funktionsfähigem Upload
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '@/constants/theme';
import { useClaimDraftStore } from '@/stores';
import type { ClaimsScreenProps } from '@/navigation/types';

const { width: screenWidth } = Dimensions.get('window');
const photoSize = (screenWidth - spacing.md * 2 - spacing.sm * 2) / 3;

export function ClaimPhotosScreen({ navigation }: ClaimsScreenProps<'ClaimPhotos'>) {
  // Store State
  const { photos, addPhoto, removePhoto, vehicle, category } = useClaimDraftStore();

  // Local State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Request Camera Permission
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Kamera-Berechtigung',
        'Bitte erlauben Sie den Kamera-Zugriff in den Einstellungen.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Request Gallery Permission
  const requestGalleryPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Galerie-Berechtigung',
        'Bitte erlauben Sie den Zugriff auf Ihre Fotos in den Einstellungen.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Take Photo with Camera
  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      setIsUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addPhoto({
          uri: result.assets[0].uri,
          type: 'camera',
        });
      }
    } catch (error) {
      Alert.alert('Fehler', 'Foto konnte nicht aufgenommen werden.');
    } finally {
      setIsUploading(false);
    }
  };

  // Pick Photo from Gallery
  const handlePickPhoto = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      setIsUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10 - photos.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        result.assets.forEach((asset) => {
          addPhoto({
            uri: asset.uri,
            type: 'gallery',
          });
        });
      }
    } catch (error) {
      Alert.alert('Fehler', 'Fotos konnten nicht ausgewählt werden.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Photo
  const handleDeletePhoto = (id: string) => {
    Alert.alert(
      'Foto löschen',
      'Möchten Sie dieses Foto wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => removePhoto(id) },
      ]
    );
  };

  // Continue to Summary
  const handleContinue = () => {
    navigation.navigate('ClaimSummary', {});
  };

  // Go Back
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
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
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <Text style={[styles.progressText, styles.progressTextActive]}>Fotos</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.progressDot} />
            <Text style={styles.progressText}>Prüfen</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.primary[600]} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Fotos hinzufügen</Text>
            <Text style={styles.infoText}>
              Fügen Sie Fotos vom Schaden hinzu. Gute Fotos helfen bei der schnelleren Bearbeitung.
            </Text>
          </View>
        </View>

        {/* Selected Data Summary */}
        {vehicle && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="car-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.summaryText}>
                {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
              </Text>
            </View>
            {category && (
              <View style={styles.summaryRow}>
                <Ionicons name="folder-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.summaryText}>{category}</Text>
              </View>
            )}
          </View>
        )}

        {/* Photo Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, (photos.length >= 10 || isUploading) && styles.actionButtonDisabled]}
            onPress={handleTakePhoto}
            disabled={photos.length >= 10 || isUploading}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="camera" size={32} color={colors.primary[600]} />
            </View>
            <Text style={styles.actionButtonText}>Foto aufnehmen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, (photos.length >= 10 || isUploading) && styles.actionButtonDisabled]}
            onPress={handlePickPhoto}
            disabled={photos.length >= 10 || isUploading}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="images" size={32} color={colors.primary[600]} />
            </View>
            <Text style={styles.actionButtonText}>Aus Galerie</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Count */}
        <Text style={styles.photoCount}>
          {photos.length} von 10 Fotos hinzugefügt
        </Text>

        {/* Photo Grid */}
        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoContainer}>
                <TouchableOpacity
                  onPress={() => setSelectedPhoto(photo.uri)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(photo.id)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error[600]} />
                </TouchableOpacity>
                <View style={styles.photoTypeIndicator}>
                  <Ionicons
                    name={photo.type === 'camera' ? 'camera' : 'images'}
                    size={12}
                    color={colors.white}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {photos.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="image-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyStateText}>Noch keine Fotos hinzugefügt</Text>
            <Text style={styles.emptyStateSubtext}>
              Tippen Sie oben auf "Foto aufnehmen" oder "Aus Galerie"
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={colors.text.secondary} />
          <Text style={styles.backButtonText}>Zurück</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Weiter zur Prüfung</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Photo Preview Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={32} color={colors.white} />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  infoTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    marginTop: spacing.xs,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary[100],
    borderStyle: 'dashed',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary[600],
  },
  // Photo Count
  photoCount: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  // Photo Grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    position: 'relative',
    width: photoSize,
    height: photoSize,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  photoTypeIndicator: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 4,
    borderRadius: borderRadius.sm,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  // Footer
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
  continueButton: {
    flex: 2,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
  },
  continueButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginRight: spacing.xs,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
});
