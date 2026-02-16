'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/use-notification-settings';
import type { DigestMode } from '@/lib/api/users';

const emailNotificationLabels = {
  newClaim: {
    title: 'Neue Schäden',
    description: 'Benachrichtigung wenn ein neuer Schaden eingereicht wird',
  },
  claimApproved: {
    title: 'Schaden freigegeben',
    description: 'Benachrichtigung wenn ein Schaden freigegeben wird',
  },
  claimRejected: {
    title: 'Schaden abgelehnt',
    description: 'Benachrichtigung wenn ein Schaden abgelehnt wird',
  },
  newComment: {
    title: 'Neue Kommentare',
    description: 'Benachrichtigung bei neuen Kommentaren zu einem Schaden',
  },
  invitation: {
    title: 'Einladungen',
    description: 'Benachrichtigung bei Einladungen zu einer Firma',
  },
} as const;

const digestModeLabels: Record<DigestMode, { title: string; description: string }> = {
  instant: {
    title: 'Sofort',
    description: 'E-Mails werden sofort gesendet, wenn etwas passiert',
  },
  daily: {
    title: 'Tägliche Zusammenfassung',
    description: 'Alle Benachrichtigungen werden einmal täglich zusammengefasst (in Entwicklung)',
  },
  none: {
    title: 'Keine E-Mails',
    description: 'Sie erhalten keine E-Mail-Benachrichtigungen',
  },
};

export default function NotificationSettingsPage() {
  const { data: settings, isLoading, error } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  // Local state for form
  const [emailSettings, setEmailSettings] = useState({
    newClaim: true,
    claimApproved: true,
    claimRejected: true,
    newComment: true,
    invitation: true,
  });
  const [digestMode, setDigestMode] = useState<DigestMode>('instant');
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with server data
  useEffect(() => {
    if (settings) {
      setEmailSettings(settings.email);
      setDigestMode(settings.digestMode);
      setHasChanges(false);
    }
  }, [settings]);

  const handleEmailToggle = (key: keyof typeof emailSettings) => {
    setEmailSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleDigestModeChange = (value: DigestMode) => {
    setDigestMode(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      email: emailSettings,
      digestMode,
    });
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Fehler beim Laden der Einstellungen
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={'/settings' as Route}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">Benachrichtigungen</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              E-Mail-Benachrichtigungen verwalten
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateSettings.isPending}
          className="gap-2 shrink-0"
        >
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Speichern
        </Button>
      </div>

      {/* Email Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle>E-Mail-Versandmodus</CardTitle>
          </div>
          <CardDescription>
            Wählen Sie, wie Sie E-Mail-Benachrichtigungen erhalten möchten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={digestMode}
            onValueChange={(value) => handleDigestModeChange(value as DigestMode)}
            className="space-y-4"
          >
            {(Object.entries(digestModeLabels) as [DigestMode, { title: string; description: string }][]).map(
              ([mode, { title, description }]) => (
                <div key={mode} className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={mode}
                    id={mode}
                    disabled={mode === 'daily'}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={mode}
                    className={`flex-1 cursor-pointer ${mode === 'daily' ? 'opacity-50' : ''}`}
                  >
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </Label>
                </div>
              )
            )}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>E-Mail-Benachrichtigungen</CardTitle>
          </div>
          <CardDescription>
            Wählen Sie, für welche Ereignisse Sie E-Mails erhalten möchten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.entries(emailNotificationLabels) as [keyof typeof emailSettings, { title: string; description: string }][]).map(
            ([key, { title, description }]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={key} className="text-base font-medium">
                    {title}
                  </Label>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Switch
                  id={key}
                  checked={emailSettings[key]}
                  onCheckedChange={() => handleEmailToggle(key)}
                  disabled={digestMode === 'none'}
                />
              </div>
            )
          )}

          {digestMode === 'none' && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Sie haben E-Mail-Benachrichtigungen deaktiviert. Aktivieren Sie den Sofort-Modus, um die einzelnen Benachrichtigungen zu konfigurieren.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
