/**
 * Forgot Password Screen
 * Passwort-Reset anfordern
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
import { authApi, getErrorMessage } from '@/services/api';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '@/constants/theme';
import type { AuthScreenProps } from '@/navigation/types';

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setIsSuccess(true);
    } catch (error) {
      Alert.alert('Fehler', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>E-Mail gesendet</Text>
          <Text style={styles.successText}>
            Wir haben Ihnen eine E-Mail mit einem Link zum Zuruecksetzen Ihres
            Passworts gesendet. Bitte pruefen Sie Ihren Posteingang.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
            <Text style={styles.backButtonText}>Zurueck zur Anmeldung</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.header}>
            <Text style={styles.title}>Passwort vergessen?</Text>
            <Text style={styles.subtitle}>
              Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link
              zum Zuruecksetzen Ihres Passworts.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-Mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="ihre.email@firma.de"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Link senden</Text>
              )}
            </TouchableOpacity>
          </View>
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
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  form: {},
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
  submitButton: {
    height: 48,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successIconText: {
    fontSize: 40,
    color: colors.success[600],
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  backButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  backButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
});
