'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { FileWarning, Car, Users, TrendingUp, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
            {trend.isPositive ? '+' : ''}{trend.value}% zum Vormonat
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, company } = useAuthStore();
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Willkommen zurueck, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            {company?.name} - Uebersicht
          </p>
        </div>
        <Link href={'/claims/new' as Route}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Neuer Schaden
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Offene Schaeden"
          value="--"
          description="Warten auf Bearbeitung"
          icon={<FileWarning className="h-4 w-4 text-orange-500" />}
        />
        <StatCard
          title="Schaeden gesamt"
          value="--"
          description="Dieses Jahr"
          icon={<FileWarning className="h-4 w-4 text-muted-foreground" />}
        />
        {isAdmin && (
          <>
            <StatCard
              title="Fahrzeuge"
              value="--"
              description="Aktive Fahrzeuge"
              icon={<Car className="h-4 w-4 text-blue-500" />}
            />
            <StatCard
              title="Mitarbeiter"
              value="--"
              description="Aktive Benutzer"
              icon={<Users className="h-4 w-4 text-green-500" />}
            />
          </>
        )}
      </div>

      {/* Quick Actions / Recent Claims */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Schnellzugriff</CardTitle>
            <CardDescription>Haeufige Aktionen</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href={'/claims/new' as Route}>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Neuen Schaden melden
              </Button>
            </Link>
            <Link href={'/claims' as Route}>
              <Button variant="outline" className="w-full justify-start">
                <FileWarning className="mr-2 h-4 w-4" />
                Alle Schaeden anzeigen
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link href={'/vehicles' as Route}>
                  <Button variant="outline" className="w-full justify-start">
                    <Car className="mr-2 h-4 w-4" />
                    Fahrzeuge verwalten
                  </Button>
                </Link>
                <Link href={'/settings/users' as Route}>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Benutzer verwalten
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Claims Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Schaeden</CardTitle>
            <CardDescription>Die neuesten Schadenmeldungen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <FileWarning className="h-12 w-12 mb-4 opacity-50" />
              <p>Noch keine Schaeden vorhanden</p>
              <p className="text-sm">Erstellen Sie Ihren ersten Schaden, um zu beginnen.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
