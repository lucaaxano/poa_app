import React, { useState, useCallback, useMemo, memo } from 'react';
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
import { colors, spacing, fontSize, fontWeight, borderRadius, damageCategoryColors } from '../../constants/theme';
import { LineSeparator } from '../common/ListSeparators';
import { createGetItemLayout, LIST_ITEM_HEIGHTS } from '../../constants/listItemHeights';

interface DamageCategory {
  value: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const DAMAGE_CATEGORIES: DamageCategory[] = [
  {
    value: 'LIABILITY',
    label: 'Haftpflicht',
    description: 'Schaden am fremden Fahrzeug oder Eigentum',
    icon: 'shield-outline',
  },
  {
    value: 'COMPREHENSIVE',
    label: 'Vollkasko',
    description: 'Schaden am eigenen Fahrzeug',
    icon: 'car-outline',
  },
  {
    value: 'GLASS',
    label: 'Glasschaden',
    description: 'Windschutzscheibe, Seitenfenster, etc.',
    icon: 'aperture-outline',
  },
  {
    value: 'WILDLIFE',
    label: 'Wildschaden',
    description: 'Kollision mit Wildtieren',
    icon: 'paw-outline',
  },
  {
    value: 'PARKING',
    label: 'Parkschaden',
    description: 'Schaden beim Parken',
    icon: 'car-sport-outline',
  },
  {
    value: 'THEFT',
    label: 'Diebstahl',
    description: 'Fahrzeugdiebstahl oder Teile',
    icon: 'lock-open-outline',
  },
  {
    value: 'VANDALISM',
    label: 'Vandalismus',
    description: 'Mutwillige Beschädigung',
    icon: 'warning-outline',
  },
  {
    value: 'OTHER',
    label: 'Sonstiges',
    description: 'Andere Schadensarten',
    icon: 'ellipsis-horizontal-outline',
  },
];

// Pre-computed background colors for categories (created once, outside component)
const CATEGORY_BG_COLORS: Record<string, { backgroundColor: string }> = Object.fromEntries(
  Object.entries(damageCategoryColors).map(([key, color]) => [
    key,
    { backgroundColor: `${color}20` },
  ])
);

interface DamageCategoryPickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Memoized Category Item Component
interface CategoryItemProps {
  item: DamageCategory;
  isSelected: boolean;
  onSelect: (value: string) => void;
}

const CategoryItem = memo(function CategoryItem({ item, isSelected, onSelect }: CategoryItemProps) {
  const handlePress = useCallback(() => {
    onSelect(item.value);
  }, [item.value, onSelect]);

  const iconBgStyle = useMemo(
    () => CATEGORY_BG_COLORS[item.value] || { backgroundColor: `${colors.gray[400]}20` },
    [item.value]
  );

  return (
    <TouchableOpacity
      style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
      onPress={handlePress}
    >
      <View style={[styles.itemIconCircle, iconBgStyle]}>
        <Ionicons
          name={item.icon}
          size={24}
          color={damageCategoryColors[item.value]}
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>
          {item.label}
        </Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
      </View>
      {isSelected && (
        <Ionicons name="checkmark" size={24} color={colors.primary[600]} />
      )}
    </TouchableOpacity>
  );
});

// FlatList optimization
const keyExtractor = (item: DamageCategory) => item.value;
const getItemLayout = createGetItemLayout<DamageCategory>(
  LIST_ITEM_HEIGHTS.categoryItem,
  LIST_ITEM_HEIGHTS.vehicleSeparator
);

export function DamageCategoryPicker({
  label,
  value,
  onValueChange,
  error,
  required = false,
  disabled = false,
}: DamageCategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedCategory = useMemo(
    () => DAMAGE_CATEGORIES.find((c) => c.value === value),
    [value]
  );

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback((categoryValue: string) => {
    onValueChange(categoryValue);
    setIsOpen(false);
  }, [onValueChange]);

  const renderCategoryItem = useCallback(({ item }: { item: DamageCategory }) => (
    <CategoryItem
      item={item}
      isSelected={item.value === value}
      onSelect={handleSelect}
    />
  ), [value, handleSelect]);

  const selectedIconBgStyle = useMemo(
    () => selectedCategory
      ? CATEGORY_BG_COLORS[selectedCategory.value] || { backgroundColor: `${colors.gray[400]}20` }
      : undefined,
    [selectedCategory]
  );

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
        {selectedCategory ? (
          <View style={styles.selectedCategory}>
            <View style={[styles.categoryIconCircle, selectedIconBgStyle]}>
              <Ionicons
                name={selectedCategory.icon}
                size={20}
                color={damageCategoryColors[selectedCategory.value]}
              />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryLabel}>{selectedCategory.label}</Text>
              <Text style={styles.categoryDescription} numberOfLines={1}>
                {selectedCategory.description}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons
              name="shield-outline"
              size={20}
              color={colors.gray[400]}
              style={styles.placeholderIcon}
            />
            <Text style={styles.placeholderText}>Kategorie auswählen</Text>
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
              <Text style={styles.modalTitle}>Schadenskategorie</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={DAMAGE_CATEGORIES}
              keyExtractor={keyExtractor}
              renderItem={renderCategoryItem}
              ItemSeparatorComponent={LineSeparator}
              getItemLayout={getItemLayout}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              initialNumToRender={10}
              windowSize={5}
            />
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
  selectedCategory: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  categoryDescription: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  placeholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderIcon: {
    marginRight: spacing.sm,
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
    maxHeight: '80%',
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  categoryItemSelected: {
    backgroundColor: colors.primary[50],
  },
  itemIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  itemLabelSelected: {
    color: colors.primary[600],
  },
  itemDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
