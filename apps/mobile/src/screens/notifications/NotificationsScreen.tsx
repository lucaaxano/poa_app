/**
 * Notifications Screen
 * Liste aller Benachrichtigungen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, fontWeight, shadow } from '@/constants/theme';
import type { MainTabScreenProps } from '@/navigation/types';

interface Notification {
  id: string;
  type: 'claim_approved' | 'claim_rejected' | 'comment' | 'status_change';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  claimId?: string;
}

const NOTIFICATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  claim_approved: 'checkmark-circle',
  claim_rejected: 'close-circle',
  comment: 'chatbubble',
  status_change: 'sync',
};

const NOTIFICATION_COLORS: Record<string, string> = {
  claim_approved: colors.success[600],
  claim_rejected: colors.error[600],
  comment: colors.primary[600],
  status_change: colors.warning[600],
};

export function NotificationsScreen({ navigation }: MainTabScreenProps<'Notifications'>) {
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Fetch notifications
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleMarkAllRead = () => {
    // TODO: Mark all as read
  };

  const handleNotificationPress = (notification: Notification) => {
    if (notification.claimId) {
      navigation.navigate('Claims', {
        screen: 'ClaimDetail',
        params: { claimId: notification.claimId },
      });
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${NOTIFICATION_COLORS[item.type]}15` },
        ]}
      >
        <Ionicons
          name={NOTIFICATION_ICONS[item.type]}
          size={24}
          color={NOTIFICATION_COLORS[item.type]}
        />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>{item.createdAt}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color={colors.gray[300]} />
      <Text style={styles.emptyText}>Keine Benachrichtigungen</Text>
      <Text style={styles.emptySubtext}>
        Sie werden hier benachrichtigt, wenn es Neuigkeiten zu Ihren Schaeden gibt.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header Actions */}
      {notifications.length > 0 && (
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={20} color={colors.primary[600]} />
            <Text style={styles.markAllText}>Alle gelesen</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    paddingBottom: 0,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    marginLeft: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  unreadItem: {
    backgroundColor: colors.primary[50],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
    marginLeft: spacing.sm,
  },
  notificationMessage: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  separator: {
    height: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 22,
  },
});
