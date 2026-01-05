import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

interface FormTextAreaProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  numberOfLines?: number;
  minHeight?: number;
  hint?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
}

export function FormTextArea({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  disabled = false,
  maxLength,
  numberOfLines = 4,
  minHeight = 100,
  hint,
  onBlur,
  onFocus,
  style,
  inputStyle,
  testID,
}: FormTextAreaProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const hasError = !!error;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { minHeight },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          multiline
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          textAlignVertical="top"
          testID={testID}
        />
      </View>

      <View style={styles.footer}>
        {(error || hint) && (
          <Text style={[styles.helperText, hasError && styles.errorText]}>
            {error || hint}
          </Text>
        )}
        {maxLength && (
          <Text style={[styles.charCount, value.length >= maxLength && styles.charCountMax]}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
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
  inputContainer: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  inputContainerFocused: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: colors.error[500],
  },
  inputContainerDisabled: {
    backgroundColor: colors.gray[100],
  },
  input: {
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.primary,
    lineHeight: fontSize.base * 1.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  helperText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  errorText: {
    color: colors.error[500],
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
  charCountMax: {
    color: colors.error[500],
  },
});
