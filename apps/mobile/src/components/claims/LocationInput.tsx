import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';
import { useLocation, LocationData } from '../../hooks/useLocation';

interface LocationInputProps {
  label: string;
  value: string;
  onValueChange: (location: string, coords?: { lat: number; lng: number }) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function LocationInput({
  label,
  value,
  onValueChange,
  error,
  required = false,
  disabled = false,
  placeholder = 'Unfallort eingeben oder GPS verwenden',
}: LocationInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { isLoading, getCurrentLocation, error: locationError } = useLocation();

  const handleGetLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      const address = location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      onValueChange(address, { lat: location.latitude, lng: location.longitude });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        <Ionicons
          name="location-outline"
          size={20}
          color={error ? colors.error[500] : colors.gray[400]}
          style={styles.locationIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => onValueChange(text)}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          numberOfLines={2}
        />
        <TouchableOpacity
          style={[styles.gpsButton, isLoading && styles.gpsButtonLoading]}
          onPress={handleGetLocation}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary[600]} />
          ) : (
            <Ionicons name="navigate" size={20} color={colors.primary[600]} />
          )}
        </TouchableOpacity>
      </View>

      {(error || locationError) && (
        <Text style={styles.errorText}>{error || locationError}</Text>
      )}

      <Text style={styles.hint}>
        Tippen Sie auf das GPS-Symbol, um den aktuellen Standort zu verwenden
      </Text>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  locationIcon: {
    marginTop: spacing.md,
    marginLeft: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md - 4,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.base,
    color: colors.text.primary,
    minHeight: 48,
  },
  gpsButton: {
    padding: spacing.md,
    alignSelf: 'center',
  },
  gpsButtonLoading: {
    opacity: 0.7,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error[500],
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});
