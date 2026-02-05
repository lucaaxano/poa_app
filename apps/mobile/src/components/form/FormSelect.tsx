import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';
import { LineSeparator } from '../common/ListSeparators';
import { createGetItemLayout, LIST_ITEM_HEIGHTS } from '../../constants/listItemHeights';

interface SelectOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface FormSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

// Memoized Option Item Component
interface OptionItemProps {
  item: SelectOption;
  isSelected: boolean;
  onSelect: (value: string) => void;
}

const OptionItem = memo(function OptionItem({ item, isSelected, onSelect }: OptionItemProps) {
  const handlePress = useCallback(() => {
    onSelect(item.value);
  }, [item.value, onSelect]);

  return (
    <TouchableOpacity
      style={[styles.optionItem, isSelected && styles.optionItemSelected]}
      onPress={handlePress}
    >
      {item.icon && (
        <Ionicons
          name={item.icon}
          size={20}
          color={isSelected ? colors.primary[600] : colors.text.secondary}
          style={styles.optionIcon}
        />
      )}
      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
        {item.label}
      </Text>
      {isSelected && (
        <Ionicons name="checkmark" size={20} color={colors.primary[600]} />
      )}
    </TouchableOpacity>
  );
});

// FlatList optimization
const keyExtractor = (item: SelectOption) => item.value;
const getItemLayout = createGetItemLayout<SelectOption>(
  LIST_ITEM_HEIGHTS.formSelectOption,
  LIST_ITEM_HEIGHTS.vehicleSeparator
);

export function FormSelect({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Auswählen...',
  error,
  required = false,
  disabled = false,
  style,
  testID,
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedOption = options.find((opt) => opt.value === value);

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback((selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  }, [onValueChange]);

  const renderOptionItem = useCallback(({ item }: { item: SelectOption }) => (
    <OptionItem
      item={item}
      isSelected={item.value === value}
      onSelect={handleSelect}
    />
  ), [value, handleSelect]);

  return (
    <View style={[styles.container, style]}>
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
        testID={testID}
      >
        {selectedOption?.icon && (
          <Ionicons
            name={selectedOption.icon}
            size={20}
            color={colors.text.primary}
            style={styles.selectedIcon}
          />
        )}
        <Text
          style={[
            styles.selectText,
            !selectedOption && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.gray[400]}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={keyExtractor}
              renderItem={renderOptionItem}
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
    paddingVertical: spacing.md - 4,
    paddingHorizontal: spacing.md,
  },
  selectButtonError: {
    borderColor: colors.error[500],
  },
  selectButtonDisabled: {
    backgroundColor: colors.gray[100],
  },
  selectedIcon: {
    marginRight: spacing.sm,
  },
  selectText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  placeholderText: {
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
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  optionItemSelected: {
    backgroundColor: colors.primary[50],
  },
  optionIcon: {
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  optionTextSelected: {
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
});
