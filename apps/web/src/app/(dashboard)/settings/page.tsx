'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Building2, Users, FileText, Bell, ArrowRight, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const settingsCards = [
  {
    title: 'Firma',
    href: '/settings/company',
    icon: Building2,
    description: 'Verwalten Sie Ihre Firmendaten, Adresse und Kontaktinformationen.',
  },
  {
    title: 'Benutzer',
    href: '/settings/users',
    icon: Users,
    description: 'Verwalten Sie Mitarbeiter, Rollen und laden Sie neue Benutzer ein.',
  },
  {
    title: 'Versicherungen',
    href: '/settings/policies',
    icon: FileText,
    description: 'Verwalten Sie Ihre Versicherungspolicen und Versicherer.',
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
];

export default function SettingsPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {settingsCards.map((card) => (
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
  );
}
