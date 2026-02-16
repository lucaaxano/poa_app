'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Building2, Users, FileText, Bell, ArrowRight, Shield, Briefcase, CreditCard, HelpCircle, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingDialog, InlineHelp } from '@/components/help';
import { useHelpStore } from '@/stores/help-store';
import { useAuthStore } from '@/stores/auth-store';
import { UserRole } from '@poa/shared';

function OnboardingResetSection() {
  const { resetAllOnboardings, seenOnboardings } = useHelpStore();
  const hasSeenAny = Object.values(seenOnboardings).some(v => v === true);

  if (!hasSeenAny) return null;

  return (
    <Card className="rounded-2xl border shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Hilfe & Onboarding</CardTitle>
            <CardDescription>
              Setzen Sie die Hilfe-Popups zurück, um sie erneut anzuzeigen
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => resetAllOnboardings()}
          variant="outline"
          className="rounded-xl"
        >
          Alle Hilfe-Popups zurücksetzen
        </Button>
      </CardContent>
    </Card>
  );
}

const settingsCards = [
  {
    title: 'Firma',
    href: '/settings/company',
    icon: Building2,
    description: 'Verwalten Sie Ihre Firmendaten, Adresse und Kontaktinformationen.',
    adminOnly: true,
  },
  {
    title: 'Benutzer',
    href: '/settings/users',
    icon: Users,
    description: 'Verwalten Sie Mitarbeiter, Rollen und laden Sie neue Benutzer ein.',
    adminOnly: true,
  },
  {
    title: 'Broker',
    href: '/settings/broker',
    icon: Briefcase,
    description: 'Verwalten Sie Ihre Broker-Verbindungen und laden Sie neue Broker ein.',
    adminOnly: true,
  },
  {
    title: 'Versicherungen',
    href: '/settings/policies',
    icon: FileText,
    description: 'Verwalten Sie Ihre Versicherungspolicen und Versicherer.',
    adminOnly: true,
  },
  {
    title: 'Benachrichtigungen',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Verwalten Sie Ihre E-Mail-Benachrichtigungseinstellungen.',
  },
  {
    title: 'Sicherheit',
    href: '/settings/security',
    icon: Shield,
    description: 'Zwei-Faktor-Authentifizierung und Kontoabsicherung.',
  },
  {
    title: 'Abrechnung',
    href: '/settings/billing',
    icon: CreditCard,
    description: 'Verwalten Sie Ihr Abonnement und sehen Sie Ihre Rechnungen ein.',
    adminOnly: true,
  },
];

export default function SettingsPage() {
  const userRole = useAuthStore((state) => state.user?.role);
  const isAdmin = userRole === UserRole.COMPANY_ADMIN || userRole === UserRole.SUPERADMIN;
  const visibleCards = settingsCards.filter((card) => !card.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      {/* Onboarding Dialog */}
      <OnboardingDialog pageKey="settings" />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Einstellungen
          </h1>
          <InlineHelp topicKey="settings-profile" />
        </div>
        <p className="text-muted-foreground">
          {isAdmin ? 'Verwalten Sie Ihre Plattform-Einstellungen' : 'Verwalten Sie Ihre Konto-Einstellungen'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map((card) => (
        <Link key={card.href} href={card.href as Route}>
          <Card className="rounded-2xl border shadow-soft hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4">{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
      </div>

      {/* Hilfe & Onboarding Section */}
      <OnboardingResetSection />
    </div>
  );
}
