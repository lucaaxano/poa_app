/**
 * Notification Settings Screen
 * Push-Benachrichtigungen konfigurieren
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, fontWeight, shadow } from '@/constants/theme';
import type { ProfileScreenProps } from '@/navigation/types';

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function NotificationSettingsScreen({ navigation }: ProfileScreenProps<'NotificationSettings'>) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      key: 'claim_approved',
      label: 'Schaden freigegeben',
      description: 'Benachrichtigung wenn ein Schaden freigegeben wurde',
      enabled: true,
    },
    {
      key: 'claim_rejected',
      label: 'Schaden abgelehnt',
      description: 'Benachrichtigung wenn ein Schaden abgelehnt wurde',
      enabled: true,
    },
    {
      key: 'new_comment',
      label: 'Neue Kommentare',
      description: 'Benachrichtigung bei neuen Kommentaren zu Ihren Schäden',
      enabled: true,
    },
    {
      key: 'status_change',
      label: 'Statusänderungen',
      description: 'Benachrichtigung wenn sich der Status eines Schadens ändert',
      enabled: true,
    },
  ]);

  const handleMasterToggle = (value: boolean) => {
    setPushEnabled(value);
    if (!value) {
      // Disable all when master is off
      setSettings(settings.map((s) => ({ ...s, enabled: false })));
    }
  };

  const handleSettingToggle = (key: string, value: boolean) => {
    setSettings(settings.map((s) => (s.key === key ? { ...s, enabled: value } : s)));
    // Enable master if any setting is enabled
    if (value && !pushEnabled) {
      setPushEnabled(true);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Save settings to backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Erfolg', 'Ihre Einstellungen wurden gespeichert.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Fehler', 'Einstellungen konnten nicht gespeichert werden.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Master Toggle */}
        <View style={styles.masterSection}>
          <View style={styles.masterToggle}>
            <View style={styles.masterInfo}>
              <Ionicons name="notifications" size={24} color={colors.primary[600]} />
              <View style={styles.masterTextContainer}>
                <Text style={styles.masterLabel}>Push-Benachrichtigungen</Text>
                <Text style={styles.masterDescription}>
                  Alle Benachrichtigungen aktivieren oder deaktivieren
                </Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handleMasterToggle}
              trackColor={{ false: colors.gray[300], true: colors.primary[400] }}
              thumbColor={pushEnabled ? colors.primary[600] : colors.gray[100]}
            />
          </View>
        </View>

        {/* Individual Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Benachrichtigungstypen</Text>
          {settings.map((setting, index) => (
            <View
              key={setting.key}
              style={[
                styles.settingItem,
                index === 0 && styles.settingItemFirst,
                index === settings.length - 1 && styles.settingItemLast,
                !pushEnabled && styles.settingItemDisabled,
              ]}
            >
              <View style={styles.settingInfo}>
                <Text
                  style={[
                    styles.settingLabel,
                    !pushEnabled && styles.settingLabelDisabled,
                  ]}
                >
                  {setting.label}
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    !pushEnabled && styles.settingDescriptionDisabled,
                  ]}
                >
                  {setting.description}
                </Text>
              </View>
              <Switch
                value={setting.enabled && pushEnabled}
                onValueChange={(value) => handleSettingToggle(setting.key, value)}
                disabled={!pushEnabled}
                trackColor={{ false: colors.gray[300], true: colors.primary[400] }}
                thumbColor={setting.enabled && pushEnabled ? colors.primary[600] : colors.gray[100]}
              />
            </View>
          ))}
        </View>

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.text.tertiary} />
          <Text style={styles.infoText}>
            Sie können Push-Benachrichtigungen auch in den Geräteeinstellungen deaktivieren.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Speichern</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  masterSection: {
    marginBottom: spacing.lg,
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  masterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  masterTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  masterLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  masterDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  settingsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingItemFirst: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  settingItemLast: {
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    borderBottomWidth: 0,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  settingLabelDisabled: {
    color: colors.text.tertiary,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  settingDescriptionDisabled: {
    color: colors.text.tertiary,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  saveButton: {
    height: 48,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
