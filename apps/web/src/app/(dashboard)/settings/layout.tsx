'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { Building2, Users, FileText, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { UserRole } from '@poa/shared';

const settingsNavItems = [
  {
    title: 'Firma',
    href: '/settings/company',
    icon: Building2,
    description: 'Firmendaten verwalten',
    adminOnly: true,
  },
  {
    title: 'Benutzer',
    href: '/settings/users',
    icon: Users,
    description: 'Mitarbeiter und Einladungen',
    adminOnly: true,
  },
  {
    title: 'Versicherungen',
    href: '/settings/policies',
    icon: FileText,
    description: 'Policen und Versicherer',
    adminOnly: true,
  },
  {
    title: 'Sicherheit',
    href: '/settings/security',
    icon: Shield,
    description: 'Zwei-Faktor-Authentifizierung',
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const userRole = useAuthStore((state) => state.user?.role);
  const isAdmin = userRole === UserRole.COMPANY_ADMIN || userRole === UserRole.SUPERADMIN;
  const visibleNavItems = settingsNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Einstellungen
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? 'Verwalten Sie Ihre Firmeneinstellungen und Benutzer' : 'Verwalten Sie Ihre Konto-Einstellungen'}
        </p>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex border-b">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              prefetch={false}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
