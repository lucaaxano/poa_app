import React, { useState } from 'react';
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
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../constants/theme';

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

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

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
        onPress={() => !disabled && setIsOpen(true)}
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
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item.value === value && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  {item.icon && (
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.value === value ? colors.primary[600] : colors.text.secondary}
                      style={styles.optionIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary[600]} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
  },
});
