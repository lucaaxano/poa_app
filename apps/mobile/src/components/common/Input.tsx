import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  onBlur?: () => void;
  onFocus?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  onBlur,
  onFocus,
  style,
  inputStyle,
  testID,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  const hasError = !!error;
  const showRightIcon = rightIcon || secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={hasError ? colors.error[500] : colors.gray[400]}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            showRightIcon && styles.inputWithRightIcon,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          testID={testID}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={toggleSecureEntry} style={styles.rightIconButton}>
            <Ionicons
              name={isSecure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.gray[400]}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            disabled={!onRightIconPress}
          >
            <Ionicons name={rightIcon} size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>
      {(error || hint) && (
        <Text style={[styles.helperText, hasError && styles.errorText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    paddingVertical: spacing.md - 4,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: spacing.xs,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  leftIcon: {
    marginLeft: spacing.md,
  },
  rightIconButton: {
    padding: spacing.md,
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.error[500],
  },
});
