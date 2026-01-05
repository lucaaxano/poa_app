import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../constants/theme';
import { useCamera, CapturedImage } from '../../hooks/useCamera';

interface PhotoCaptureProps {
  onPhotoCaptured: (photo: CapturedImage) => void;
  onMultiplePhotos?: (photos: CapturedImage[]) => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
}

export function PhotoCapture({
  onPhotoCaptured,
  onMultiplePhotos,
  disabled = false,
  variant = 'default',
}: PhotoCaptureProps) {
  const { isLoading, takePhoto, pickFromGallery, pickMultipleFromGallery } = useCamera({
    quality: 0.8,
  });

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo) {
      onPhotoCaptured(photo);
    }
  };

  const handlePickFromGallery = async () => {
    if (onMultiplePhotos) {
      const photos = await pickMultipleFromGallery();
      if (photos.length > 0) {
        onMultiplePhotos(photos);
      }
    } else {
      const photo = await pickFromGallery();
      if (photo) {
        onPhotoCaptured(photo);
      }
    }
  };

  const showOptions = () => {
    Alert.alert(
      'Foto hinzufügen',
      'Wählen Sie eine Option',
      [
        { text: 'Kamera', onPress: handleTakePhoto },
        { text: 'Galerie', onPress: handlePickFromGallery },
        { text: 'Abbrechen', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          style={[styles.compactButton, disabled && styles.disabled]}
          onPress={handleTakePhoto}
          disabled={disabled || isLoading}
        >
          <Ionicons name="camera" size={24} color={colors.primary[600]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.compactButton, disabled && styles.disabled]}
          onPress={handlePickFromGallery}
          disabled={disabled || isLoading}
        >
          <Ionicons name="images" size={24} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.mainButton, disabled && styles.disabled]}
        onPress={handleTakePhoto}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="camera" size={32} color={colors.white} />
        </View>
        <Text style={styles.mainButtonText}>Foto aufnehmen</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, disabled && styles.disabled]}
        onPress={handlePickFromGallery}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        <Ionicons name="images-outline" size={24} color={colors.primary[600]} />
        <Text style={styles.secondaryButtonText}>Aus Galerie wählen</Text>
      </TouchableOpacity>

      {isLoading && (
        <Text style={styles.loadingText}>Wird verarbeitet...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.primary[600],
  },
  disabled: {
    opacity: 0.5,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  compactButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
});
