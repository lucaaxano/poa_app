import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';
import { useNetworkStore } from '../../stores/networkStore';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
}

export function OfflineIndicator({ showWhenOnline = false }: OfflineIndicatorProps) {
  const { isConnected, isInternetReachable } = useNetworkStore();
  const insets = useSafeAreaInsets();

  const isOnline = isConnected && isInternetReachable !== false;

  if (isOnline && !showWhenOnline) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        isOnline ? styles.online : styles.offline,
        { paddingTop: insets.top > 0 ? insets.top : spacing.sm },
      ]}
    >
      <Ionicons
        name={isOnline ? 'wifi' : 'cloud-offline'}
        size={16}
        color={colors.white}
        style={styles.icon}
      />
      <Text style={styles.text}>
        {isOnline ? 'Verbunden' : 'Offline - Änderungen werden gespeichert'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  offline: {
    backgroundColor: colors.warning[600],
  },
  online: {
    backgroundColor: colors.success[600],
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
});
