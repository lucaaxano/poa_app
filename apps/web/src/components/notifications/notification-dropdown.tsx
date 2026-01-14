'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './notification-item';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/use-notifications';

// PERFORMANCE FIX: Memoized component to prevent unnecessary re-renders
export const NotificationDropdown = memo(function NotificationDropdown() {
  // Track if dropdown has been opened at least once
  const [hasBeenOpened, setHasBeenOpened] = useState(false);

  // PERFORMANCE FIX: Only fetch unread count (lightweight), not full notifications
  // Full notifications are loaded only when dropdown is opened
  const { data: unreadCount = 0 } = useUnreadCount();

  // PERFORMANCE FIX: Only fetch notifications after dropdown is opened for the first time
  // This prevents heavy API calls during initial page load
  const { data: notificationsData, isLoading } = useNotifications(
    hasBeenOpened ? { limit: 10 } : undefined
  );

  // Mutations
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = notificationsData?.notifications ?? [];
  const hasUnread = unreadCount > 0;

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  // Handle dropdown open to trigger notifications fetch
  const handleOpenChange = (open: boolean) => {
    if (open && !hasBeenOpened) {
      setHasBeenOpened(true);
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl h-10 w-10"
          aria-label={`Benachrichtigungen${hasUnread ? ` (${unreadCount} ungelesen)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Benachrichtigungen</h3>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Alle gelesen
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Keine Benachrichtigungen</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sie haben keine neuen Benachrichtigungen
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-2">
              <Link href={'/notifications' as Route}>
                <Button
                  variant="ghost"
                  className="w-full h-9 text-sm"
                >
                  Alle Benachrichtigungen anzeigen
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
