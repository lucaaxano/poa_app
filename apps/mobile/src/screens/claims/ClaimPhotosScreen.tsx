/**
 * Claim Photos Screen
 * Fotos zum Schaden hinzufuegen
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, fontWeight, shadow } from '@/constants/theme';
import type { ClaimsScreenProps } from '@/navigation/types';

interface Photo {
  uri: string;
  localPath: string;
}

export function ClaimPhotosScreen({ navigation }: ClaimsScreenProps<'ClaimPhotos'>) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const handleTakePhoto = async () => {
    // TODO: Implement camera
    Alert.alert('Info', 'Kamera-Funktion wird implementiert');
  };

  const handlePickFromGallery = async () => {
    // TODO: Implement image picker
    Alert.alert('Info', 'Galerie-Funktion wird implementiert');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    navigation.navigate('ClaimSummary', {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color={colors.primary[600]} />
          <Text style={styles.infoText}>
            Fotografieren Sie den Schaden aus verschiedenen Perspektiven.
            Mindestens 3 Fotos werden empfohlen.
          </Text>
        </View>

        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemovePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color={colors.error[600]} />
              </TouchableOpacity>
              <View style={styles.photoIndex}>
                <Text style={styles.photoIndexText}>{index + 1}</Text>
              </View>
            </View>
          ))}

          {/* Add Photo Buttons */}
          <TouchableOpacity style={styles.addPhotoButton} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={32} color={colors.primary[600]} />
            <Text style={styles.addPhotoText}>Foto aufnehmen</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickFromGallery}>
            <Ionicons name="images" size={32} color={colors.primary[600]} />
            <Text style={styles.addPhotoText}>Aus Galerie</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Count */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {photos.length} {photos.length === 1 ? 'Foto' : 'Fotos'} hinzugefuegt
          </Text>
          {photos.length < 3 && (
            <Text style={styles.countHint}>
              (mindestens 3 empfohlen)
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.secondary} />
          <Text style={styles.backButtonText}>Zurueck</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Weiter</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
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
    alignItems: 'flex-start',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primary[700],
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  photoIndex: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.black,
    opacity: 0.7,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  photoIndexText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  addPhotoButton: {
    width: '48%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    marginTop: spacing.xs,
  },
  countContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  countText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  countHint: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
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
});
