/**
 * Change Password Screen
 * Passwort aendern
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authApi, getErrorMessage } from '@/services/api';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '@/constants/theme';
import type { ProfileScreenProps } from '@/navigation/types';

export function ChangePasswordScreen({ navigation }: ProfileScreenProps<'ChangePassword'>) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = [
    { label: 'Mindestens 8 Zeichen', met: newPassword.length >= 8 },
    { label: 'Mindestens ein Grossbuchstabe', met: /[A-Z]/.test(newPassword) },
    { label: 'Mindestens ein Kleinbuchstabe', met: /[a-z]/.test(newPassword) },
    { label: 'Mindestens eine Zahl', met: /\d/.test(newPassword) },
  ];

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Fehler', 'Bitte fuellen Sie alle Felder aus.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Fehler', 'Die neuen Passwoerter stimmen nicht ueberein.');
      return;
    }

    const allRequirementsMet = passwordRequirements.every((req) => req.met);
    if (!allRequirementsMet) {
      Alert.alert('Fehler', 'Das neue Passwort erfuellt nicht alle Anforderungen.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert(
        'Erfolg',
        'Ihr Passwort wurde erfolgreich geaendert.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Fehler', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Aktuelles Passwort</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Aktuelles Passwort eingeben"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Neues Passwort</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Neues Passwort eingeben"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            {passwordRequirements.map((req, index) => (
              <View key={index} style={styles.requirementRow}>
                <Ionicons
                  name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={req.met ? colors.success[600] : colors.text.tertiary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    req.met && styles.requirementTextMet,
                  ]}
                >
                  {req.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Passwort bestaetigen</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Neues Passwort wiederholen"
              placeholderTextColor={colors.text.tertiary}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              editable={!isLoading}
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={styles.mismatchError}>
                Passwoerter stimmen nicht ueberein
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Passwort aendern</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  showPasswordButton: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  requirementsContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requirementText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
  requirementTextMet: {
    color: colors.success[600],
  },
  mismatchError: {
    fontSize: fontSize.sm,
    color: colors.error[600],
    marginTop: spacing.xs,
  },
  submitButton: {
    height: 48,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
