'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { FileWarning, Car, Users, TrendingUp, Plus, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon, iconBg, trend }: StatCardProps) {
  return (
    <Card className="rounded-2xl border shadow-soft hover:shadow-soft-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`mt-2 flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-4 w-4 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
            {trend.isPositive ? '+' : ''}{trend.value}% zum Vormonat
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: Route;
}

function QuickAction({ icon, title, description, href }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="group flex items-center gap-4 rounded-xl border bg-white p-4 transition-all hover:border-primary/20 hover:shadow-soft">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, company } = useAuthStore();
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Willkommen zurueck, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Hier ist eine Uebersicht ueber {company?.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Offene Schaeden"
          value="--"
          description="Warten auf Bearbeitung"
          icon={<AlertCircle className="h-5 w-5 text-orange-600" />}
          iconBg="bg-orange-50"
        />
        <StatCard
          title="Schaeden gesamt"
          value="--"
          description="Dieses Jahr"
          icon={<FileWarning className="h-5 w-5 text-primary" />}
          iconBg="bg-primary/5"
        />
        {isAdmin && (
          <>
            <StatCard
              title="Fahrzeuge"
              value="--"
              description="Aktive Fahrzeuge"
              icon={<Car className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-50"
            />
            <StatCard
              title="Mitarbeiter"
              value="--"
              description="Aktive Benutzer"
              icon={<Users className="h-5 w-5 text-green-600" />}
              iconBg="bg-green-50"
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Quick Actions */}
        <Card className="rounded-2xl border shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>Schnellzugriff</CardTitle>
            <CardDescription>Haeufige Aktionen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickAction
              icon={<Plus className="h-5 w-5" />}
              title="Neuen Schaden melden"
              description="Schaden erfassen und dokumentieren"
              href={'/claims/new' as Route}
            />
            <QuickAction
              icon={<FileWarning className="h-5 w-5" />}
              title="Alle Schaeden"
              description="Schaeden einsehen und verwalten"
              href={'/claims' as Route}
            />
            {isAdmin && (
              <>
                <QuickAction
                  icon={<Car className="h-5 w-5" />}
                  title="Fahrzeuge verwalten"
                  description="Fuhrpark bearbeiten"
                  href={'/vehicles' as Route}
                />
                <QuickAction
                  icon={<Users className="h-5 w-5" />}
                  title="Benutzer verwalten"
                  description="Team und Berechtigungen"
                  href={'/settings/users' as Route}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Claims */}
        <Card className="rounded-2xl border shadow-soft lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Letzte Schaeden</CardTitle>
              <CardDescription>Die neuesten Schadenmeldungen</CardDescription>
            </div>
            <Link href={'/claims' as Route}>
              <Button variant="ghost" size="sm" className="text-primary">
                Alle anzeigen
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Noch keine Schaeden</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                Erstellen Sie Ihren ersten Schaden, um hier die neuesten Meldungen zu sehen.
              </p>
              <Link href={'/claims/new' as Route} className="mt-6">
                <Button className="rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  Ersten Schaden melden
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
