'use client';

import { memo, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  FileText,
  CheckCircle,
  XCircle,
  Send,
  MessageSquare,
  Mail,
  Bell,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Notification, NotificationType } from '@/lib/api/notifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

// Icon mapping for notification types
const typeIcons: Record<NotificationType, typeof FileText> = {
  NEW_CLAIM: FileText,
  CLAIM_APPROVED: CheckCircle,
  CLAIM_REJECTED: XCircle,
  CLAIM_SENT: Send,
  NEW_COMMENT: MessageSquare,
  INVITATION: Mail,
  SYSTEM: Bell,
};

// Color mapping for notification types
const typeColors: Record<NotificationType, string> = {
  NEW_CLAIM: 'text-blue-600 bg-blue-50',
  CLAIM_APPROVED: 'text-green-600 bg-green-50',
  CLAIM_REJECTED: 'text-red-600 bg-red-50',
  CLAIM_SENT: 'text-purple-600 bg-purple-50',
  NEW_COMMENT: 'text-amber-600 bg-amber-50',
  INVITATION: 'text-indigo-600 bg-indigo-50',
  SYSTEM: 'text-gray-600 bg-gray-50',
};

export const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  showDelete = false,
}: NotificationItemProps) {
  const router = useRouter();
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || 'text-gray-600 bg-gray-50';
  const isUnread = !notification.readAt;

  const handleClick = useCallback(() => {
    // Mark as read if unread
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to related claim if available
    const data = notification.data as { claimId?: string } | null;
    if (data?.claimId) {
      router.push(`/claims/${data.claimId}` as Route);
    }
  }, [isUnread, onMarkAsRead, notification.id, notification.data, router]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  }, [onDelete, notification.id]);

  const timeAgo = useMemo(() => formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: de,
  }), [notification.createdAt]);

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
        isUnread ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-muted/50',
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-label={`${notification.title}: ${notification.message}`}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 p-2 rounded-full', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium', isUnread && 'text-foreground')}>
            {notification.title}
          </p>
          {isUnread && (
            <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-600" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>

      {/* Delete button */}
      {showDelete && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDelete}
          aria-label="Benachrichtigung löschen"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
});
