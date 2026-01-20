'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, FileWarning, Car, Shield, TrendingUp, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useAdminStats } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { Route } from 'next';

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error, refetch, isRefetching } = useAdminStats();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Fehler beim Laden der Statistiken</p>
          <Button
            onClick={() => refetch()}
            disabled={isRefetching}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Wird geladen...' : 'Erneut versuchen'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Systemweite Uebersicht und Verwaltung
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Firmen"
          value={stats?.totalCompanies}
          icon={<Building2 className="h-5 w-5" />}
          href={'/admin/companies' as Route}
          isLoading={isLoading}
        />
        <StatsCard
          title="Benutzer"
          value={stats?.totalUsers}
          subtitle={stats ? `${stats.activeUsers} aktiv` : undefined}
          icon={<Users className="h-5 w-5" />}
          href={'/admin/users' as Route}
          isLoading={isLoading}
        />
        <StatsCard
          title="Schaeden"
          value={stats?.totalClaims}
          icon={<FileWarning className="h-5 w-5" />}
          href={'/admin/claims' as Route}
          isLoading={isLoading}
        />
        <StatsCard
          title="Fahrzeuge"
          value={stats?.totalVehicles}
          icon={<Car className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <StatsCard
          title="Versicherer"
          value={stats?.totalInsurers}
          icon={<Shield className="h-5 w-5" />}
          href={'/admin/insurers' as Route}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        <ActivityCard
          title="Neue Firmen"
          subtitle="Diesen Monat"
          value={stats?.recentActivity.newCompaniesThisMonth}
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          isLoading={isLoading}
        />
        <ActivityCard
          title="Neue Schaeden"
          subtitle="Diese Woche"
          value={stats?.recentActivity.newClaimsThisWeek}
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          isLoading={isLoading}
        />
        <ActivityCard
          title="Offene Schaeden"
          subtitle="Warten auf Bearbeitung"
          value={stats?.recentActivity.pendingClaims}
          icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          isLoading={isLoading}
          href={'/admin/claims?status=SUBMITTED' as Route}
        />
      </div>

      {/* Claims by Status */}
      {stats?.claimsByStatus && Object.keys(stats.claimsByStatus).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Schaeden nach Status</CardTitle>
            <CardDescription>Uebersicht aller Schaeden im System</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
              {Object.entries(stats.claimsByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex flex-col items-center p-4 rounded-lg bg-muted/50"
                >
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-sm text-muted-foreground">{getStatusLabel(status)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellzugriff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickLink
              title="Alle Firmen"
              description="Firmen verwalten"
              href={'/admin/companies' as Route}
              icon={<Building2 className="h-8 w-8" />}
            />
            <QuickLink
              title="Alle Benutzer"
              description="Benutzer verwalten"
              href={'/admin/users' as Route}
              icon={<Users className="h-8 w-8" />}
            />
            <QuickLink
              title="Alle Schaeden"
              description="Schaeden einsehen"
              href={'/admin/claims' as Route}
              icon={<FileWarning className="h-8 w-8" />}
            />
            <QuickLink
              title="Versicherer"
              description="Versicherer verwalten"
              href={'/admin/insurers' as Route}
              icon={<Shield className="h-8 w-8" />}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  subtitle,
  icon,
  href,
  isLoading,
}: {
  title: string;
  value?: number;
  subtitle?: string;
  icon: React.ReactNode;
  href?: Route;
  isLoading: boolean;
}) {
  const content = (
    <Card className={href ? 'hover:bg-muted/50 transition-colors cursor-pointer' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{value ?? 0}</div>
                <p className="text-sm text-muted-foreground">{title}</p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
              </>
            )}
          </div>
          <div className="p-3 bg-muted rounded-full">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// Activity Card Component
function ActivityCard({
  title,
  subtitle,
  value,
  icon,
  href,
  isLoading,
}: {
  title: string;
  subtitle: string;
  value?: number;
  icon: React.ReactNode;
  href?: Route;
  isLoading: boolean;
}) {
  const content = (
    <Card className={href ? 'hover:bg-muted/50 transition-colors cursor-pointer' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-muted rounded-full">{icon}</div>
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-6 w-12 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-xl font-bold">{value ?? 0}</div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// Quick Link Component
function QuickLink({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: Route;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}

// Helper function for status labels
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Entwurf',
    SUBMITTED: 'Eingereicht',
    APPROVED: 'Genehmigt',
    SENT: 'Gesendet',
    ACKNOWLEDGED: 'Bestaetigt',
    CLOSED: 'Geschlossen',
    REJECTED: 'Abgelehnt',
  };
  return labels[status] || status;
}
