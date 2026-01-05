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

interface FormTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (time: Date) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  minuteInterval?: 1 | 5 | 10 | 15 | 30;
  style?: ViewStyle;
  testID?: string;
}

export function FormTimePicker({
  label,
  value,
  onChange,
  placeholder = 'Zeit wählen',
  error,
  required = false,
  disabled = false,
  minuteInterval = 5,
  style,
  testID,
}: FormTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime] = useState(value || new Date());

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedTime) {
        onChange(selectedTime);
      }
    } else {
      if (selectedTime) {
        setTempTime(selectedTime);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempTime);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempTime(value || new Date());
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
          name="time-outline"
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
          {value ? formatTime(value) : placeholder}
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
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={handleChange}
                minuteInterval={minuteInterval}
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
            mode="time"
            display="default"
            onChange={handleChange}
            minuteInterval={minuteInterval}
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
