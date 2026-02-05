import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';
import { useVehicles, Vehicle } from '../../hooks/useVehicles';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { LineSeparator } from '../common/ListSeparators';
import { createGetItemLayout, LIST_ITEM_HEIGHTS } from '../../constants/listItemHeights';

interface VehicleSelectorProps {
  label: string;
  value: string;
  onValueChange: (vehicleId: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Memoized Vehicle Item Component
interface VehicleItemProps {
  item: Vehicle;
  isSelected: boolean;
  onSelect: (vehicleId: string) => void;
}

const VehicleItem = memo(function VehicleItem({ item, isSelected, onSelect }: VehicleItemProps) {
  const handlePress = useCallback(() => {
    onSelect(item.id);
  }, [item.id, onSelect]);

  return (
    <TouchableOpacity
      style={[styles.vehicleItem, isSelected && styles.vehicleItemSelected]}
      onPress={handlePress}
    >
      <Ionicons
        name="car"
        size={24}
        color={isSelected ? colors.primary[600] : colors.gray[500]}
        style={styles.itemIcon}
      />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemLicensePlate, isSelected && styles.itemTextSelected]}>
          {item.licensePlate}
        </Text>
        {item.brand && item.model && (
          <Text style={styles.itemModel}>
            {item.brand} {item.model}
          </Text>
        )}
        {item.vin && (
          <Text style={styles.itemVin}>VIN: {item.vin}</Text>
        )}
      </View>
      {isSelected && (
        <Ionicons name="checkmark" size={24} color={colors.primary[600]} />
      )}
    </TouchableOpacity>
  );
});

// FlatList optimization
const keyExtractor = (item: Vehicle) => item.id;
const getItemLayout = createGetItemLayout<Vehicle>(
  LIST_ITEM_HEIGHTS.vehicleItem,
  LIST_ITEM_HEIGHTS.vehicleSeparator
);

export function VehicleSelector({
  label,
  value,
  onValueChange,
  error,
  required = false,
  disabled = false,
}: VehicleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { vehicles, isLoading, error: loadError, refresh } = useVehicles();

  const selectedVehicle = vehicles.find((v) => v.id === value);

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback((vehicleId: string) => {
    onValueChange(vehicleId);
    setIsOpen(false);
  }, [onValueChange]);

  const renderVehicleItem = useCallback(({ item }: { item: Vehicle }) => (
    <VehicleItem
      item={item}
      isSelected={item.id === value}
      onSelect={handleSelect}
    />
  ), [value, handleSelect]);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>

      <TouchableOpacity
        style={[
          styles.selectButton,
          error && styles.selectButtonError,
          disabled && styles.selectButtonDisabled,
        ]}
        onPress={handleOpen}
        disabled={disabled}
      >
        {selectedVehicle ? (
          <View style={styles.selectedVehicle}>
            <Ionicons name="car" size={24} color={colors.primary[600]} style={styles.vehicleIcon} />
            <View style={styles.vehicleInfo}>
              <Text style={styles.licensePlate}>{selectedVehicle.licensePlate}</Text>
              {selectedVehicle.brand && selectedVehicle.model && (
                <Text style={styles.vehicleModel}>
                  {selectedVehicle.brand} {selectedVehicle.model}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="car-outline" size={24} color={colors.gray[400]} style={styles.vehicleIcon} />
            <Text style={styles.placeholderText}>Fahrzeug auswählen</Text>
          </View>
        )}
        <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fahrzeug auswählen</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <LoadingSpinner message="Lade Fahrzeuge..." />
            ) : loadError ? (
              <EmptyState
                icon="warning-outline"
                title="Fehler beim Laden"
                description={loadError}
                actionLabel="Erneut versuchen"
                onAction={refresh}
              />
            ) : vehicles.length === 0 ? (
              <EmptyState
                icon="car-outline"
                title="Keine Fahrzeuge"
                description="Es wurden keine Fahrzeuge gefunden."
              />
            ) : (
              <FlatList
                data={vehicles}
                keyExtractor={keyExtractor}
                renderItem={renderVehicleItem}
                ItemSeparatorComponent={LineSeparator}
                getItemLayout={getItemLayout}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                initialNumToRender={10}
                windowSize={5}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  required: {
    fontSize: fontSize.sm,
    color: colors.error[500],
    marginLeft: spacing.xs - 2,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  selectButtonError: {
    borderColor: colors.error[500],
  },
  selectButtonDisabled: {
    backgroundColor: colors.gray[100],
  },
  selectedVehicle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    marginRight: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  licensePlate: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  vehicleModel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  placeholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: fontSize.base,
    color: colors.gray[400],
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error[500],
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  vehicleItemSelected: {
    backgroundColor: colors.primary[50],
  },
  itemIcon: {
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemLicensePlate: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  itemTextSelected: {
    color: colors.primary[600],
  },
  itemModel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  itemVin: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
