'use client';

import { useState, useCallback } from 'react';
import {
  Bell,
  Check,
  Trash2,
  Loader2,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NotificationItem } from '@/components/notifications/notification-item';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/use-notifications';
import type { NotificationType } from '@/lib/api/notifications';

const typeLabels: Record<NotificationType, string> = {
  NEW_CLAIM: 'Neuer Schaden',
  CLAIM_APPROVED: 'Schaden freigegeben',
  CLAIM_REJECTED: 'Schaden abgelehnt',
  CLAIM_SENT: 'Schaden gesendet',
  NEW_COMMENT: 'Neuer Kommentar',
  INVITATION: 'Einladung',
  SYSTEM: 'System',
};

export default function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const filters = {
    type: typeFilter !== 'all' ? (typeFilter as NotificationType) : undefined,
    unreadOnly: readFilter === 'unread' ? true : undefined,
    page,
    limit: 20,
  };

  const { data, isLoading, error } = useNotifications(filters);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications ?? [];
  const totalPages = data?.totalPages ?? 1;
  const hasUnread = notifications.some(n => !n.readAt);

  // Memoized handlers to prevent unnecessary re-renders
  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead.mutate(id);
  }, [markAsRead]);

  const handleDelete = useCallback((id: string) => {
    deleteNotification.mutate(id);
  }, [deleteNotification]);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  // Memoized filter handlers
  const handleTypeFilterChange = useCallback((v: string) => {
    setTypeFilter(v);
    setPage(1);
  }, []);

  const handleReadFilterChange = useCallback((v: string) => {
    setReadFilter(v);
    setPage(1);
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage(p => Math.min(totalPages, p + 1));
  }, [totalPages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benachrichtigungen</h1>
          <p className="text-muted-foreground">
            Alle Ihre Benachrichtigungen an einem Ort
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Alle als gelesen markieren
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">Filter</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Typ</label>
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Typen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={readFilter} onValueChange={handleReadFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="unread">Nur ungelesene</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {data?.total ?? 0} Benachrichtigung{data?.total !== 1 ? 'en' : ''}
          </CardTitle>
          <CardDescription>
            Seite {page} von {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              Fehler beim Laden der Benachrichtigungen
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Keine Benachrichtigungen</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                {typeFilter !== 'all' || readFilter !== 'all'
                  ? 'Keine Benachrichtigungen für die ausgewählten Filter gefunden.'
                  : 'Sie haben noch keine Benachrichtigungen erhalten.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  showDelete
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1}
              >
                Zurück
              </Button>
              <span className="text-sm text-muted-foreground">
                Seite {page} von {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page === totalPages}
              >
                Weiter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
