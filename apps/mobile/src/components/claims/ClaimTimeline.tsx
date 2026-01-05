import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

export interface TimelineEvent {
  id: string;
  eventType: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface ClaimTimelineProps {
  events: TimelineEvent[];
  maxItems?: number;
}

const eventLabels: Record<string, string> = {
  CREATED: 'Erstellt',
  SUBMITTED: 'Eingereicht',
  APPROVED: 'Genehmigt',
  SENT: 'Gesendet',
  ACKNOWLEDGED: 'Bestätigt',
  CLOSED: 'Abgeschlossen',
  REJECTED: 'Abgelehnt',
  COMMENT_ADDED: 'Kommentar',
  ATTACHMENT_ADDED: 'Anhang hinzugefügt',
  UPDATED: 'Aktualisiert',
};

const eventIcons: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  CREATED: { name: 'add-circle', color: colors.primary[500] },
  SUBMITTED: { name: 'paper-plane', color: colors.info[500] },
  APPROVED: { name: 'checkmark-circle', color: colors.success[500] },
  SENT: { name: 'send', color: colors.info[600] },
  ACKNOWLEDGED: { name: 'checkmark-done', color: colors.success[600] },
  CLOSED: { name: 'archive', color: colors.gray[500] },
  REJECTED: { name: 'close-circle', color: colors.error[500] },
  COMMENT_ADDED: { name: 'chatbubble', color: colors.primary[400] },
  ATTACHMENT_ADDED: { name: 'attach', color: colors.primary[400] },
  UPDATED: { name: 'create', color: colors.warning[500] },
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function ClaimTimeline({ events, maxItems }: ClaimTimelineProps) {
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;
  const hasMore = maxItems && events.length > maxItems;

  return (
    <View style={styles.container}>
      {displayEvents.map((event, index) => {
        const isLast = index === displayEvents.length - 1;
        const eventInfo = eventIcons[event.eventType] || {
          name: 'ellipse' as const,
          color: colors.gray[400],
        };

        return (
          <View key={event.id} style={styles.eventRow}>
            <View style={styles.iconColumn}>
              <View style={[styles.iconCircle, { backgroundColor: eventInfo.color + '20' }]}>
                <Ionicons name={eventInfo.name} size={16} color={eventInfo.color} />
              </View>
              {!isLast && <View style={styles.connector} />}
            </View>

            <View style={styles.content}>
              <Text style={styles.eventLabel}>
                {eventLabels[event.eventType] || event.eventType}
              </Text>
              <Text style={styles.eventMeta}>
                {event.user.firstName} {event.user.lastName} · {formatDateTime(event.createdAt)}
              </Text>
            </View>
          </View>
        );
      })}

      {hasMore && (
        <View style={styles.moreIndicator}>
          <Text style={styles.moreText}>
            +{events.length - maxItems!} weitere Ereignisse
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  eventRow: {
    flexDirection: 'row',
    minHeight: 60,
  },
  iconColumn: {
    alignItems: 'center',
    width: 40,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.light,
    marginTop: spacing.xs,
    marginBottom: -spacing.sm,
  },
  content: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.md,
  },
  eventLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs - 2,
  },
  eventMeta: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  moreIndicator: {
    paddingLeft: 40 + spacing.md,
    paddingTop: spacing.sm,
  },
  moreText: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
});
