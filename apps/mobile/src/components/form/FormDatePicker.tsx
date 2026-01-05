import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ViewStyle,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';
import { Button } from '../common/Button';

interface FormDatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: ViewStyle;
  testID?: string;
}

export function FormDatePicker({
  label,
  value,
  onChange,
  placeholder = 'Datum wählen',
  error,
  required = false,
  disabled = false,
  minimumDate,
  maximumDate,
  style,
  testID,
}: FormDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value || new Date());
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>

      <TouchableOpacity
        style={[
          styles.pickerButton,
          error && styles.pickerButtonError,
          disabled && styles.pickerButtonDisabled,
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
        testID={testID}
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={value ? colors.text.primary : colors.gray[400]}
          style={styles.icon}
        />
        <Text
          style={[
            styles.valueText,
            !value && styles.placeholderText,
          ]}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Button title="Abbrechen" onPress={handleCancel} variant="ghost" size="sm" />
                <Text style={styles.modalTitle}>{label}</Text>
                <Button title="Fertig" onPress={handleConfirm} variant="ghost" size="sm" />
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="de-DE"
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display="default"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        )
      )}
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
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingVertical: spacing.md - 4,
    paddingHorizontal: spacing.md,
  },
  pickerButtonError: {
    borderColor: colors.error[500],
  },
  pickerButtonDisabled: {
    backgroundColor: colors.gray[100],
  },
  icon: {
    marginRight: spacing.sm,
  },
  valueText: {
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
  picker: {
    height: 200,
  },
});
