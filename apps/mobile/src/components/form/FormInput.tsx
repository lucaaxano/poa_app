import React from 'react';
import { View, Text, StyleSheet, ViewStyle, KeyboardTypeOptions } from 'react-native';
import { Input } from '../common/Input';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  hint?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  editable = true,
  multiline,
  numberOfLines,
  maxLength,
  hint,
  onBlur,
  onFocus,
  style,
  testID,
}: FormInputProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={error}
        hint={hint}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        onRightIconPress={onRightIconPress}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        onBlur={onBlur}
        onFocus={onFocus}
        testID={testID}
        style={styles.input}
      />
      {maxLength && (
        <Text style={styles.charCount}>
          {value.length}/{maxLength}
        </Text>
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
  input: {
    marginBottom: 0,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
