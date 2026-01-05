import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

export interface PhotoItem {
  id: string;
  uri: string;
  name?: string;
}

interface PhotoGalleryProps {
  photos: PhotoItem[];
  columns?: number;
  editable?: boolean;
  onRemove?: (photoId: string) => void;
  onAdd?: () => void;
  maxPhotos?: number;
  emptyText?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PhotoGallery({
  photos,
  columns = 3,
  editable = false,
  onRemove,
  onAdd,
  maxPhotos = 10,
  emptyText = 'Keine Fotos vorhanden',
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const insets = useSafeAreaInsets();

  const itemSpacing = spacing.sm;
  const totalSpacing = (columns + 1) * itemSpacing;
  const itemSize = (SCREEN_WIDTH - totalSpacing - spacing.md * 2) / columns;

  const canAddMore = photos.length < maxPhotos;

  const renderPhoto = ({ item }: { item: PhotoItem }) => (
    <TouchableOpacity
      style={[styles.photoItem, { width: itemSize, height: itemSize }]}
      onPress={() => setSelectedPhoto(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.uri }} style={styles.photo} />
      {editable && onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={24} color={colors.error[500]} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderAddButton = () => {
    if (!editable || !onAdd || !canAddMore) return null;

    return (
      <TouchableOpacity
        style={[styles.addButton, { width: itemSize, height: itemSize }]}
        onPress={onAdd}
      >
        <Ionicons name="add" size={32} color={colors.primary[500]} />
        <Text style={styles.addText}>Hinzufügen</Text>
      </TouchableOpacity>
    );
  };

  if (photos.length === 0 && !editable) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={48} color={colors.gray[300]} />
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={renderPhoto}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        ListFooterComponent={renderAddButton}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
      />

      <Text style={styles.counter}>
        {photos.length}/{maxPhotos} Fotos
      </Text>

      {/* Vollbild-Ansicht */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + spacing.md }]}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto.uri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  grid: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  photoItem: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
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
  addButton: {
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  addText: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  counter: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 10,
    padding: spacing.sm,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
});
