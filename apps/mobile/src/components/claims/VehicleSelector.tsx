import React, { useState } from 'react';
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
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../constants/theme';
import { useVehicles } from '../../hooks/useVehicles';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface VehicleSelectorProps {
  label: string;
  value: string;
  onValueChange: (vehicleId: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

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

  const handleSelect = (vehicleId: string) => {
    onValueChange(vehicleId);
    setIsOpen(false);
  };

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
        onPress={() => !disabled && setIsOpen(true)}
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
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fahrzeug auswählen</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
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
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.vehicleItem,
                      item.id === value && styles.vehicleItemSelected,
                    ]}
                    onPress={() => handleSelect(item.id)}
                  >
                    <Ionicons
                      name="car"
                      size={24}
                      color={item.id === value ? colors.primary[600] : colors.gray[500]}
                      style={styles.itemIcon}
                    />
                    <View style={styles.itemInfo}>
                      <Text
                        style={[
                          styles.itemLicensePlate,
                          item.id === value && styles.itemTextSelected,
                        ]}
                      >
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
                    {item.id === value && (
                      <Ionicons name="checkmark" size={24} color={colors.primary[600]} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
  },
});
