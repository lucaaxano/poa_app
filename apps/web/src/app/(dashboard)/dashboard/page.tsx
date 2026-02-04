'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { FileWarning, Car, Users, TrendingUp, Plus, ArrowRight, Clock, AlertCircle, Loader2, Building2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useCompanyStats } from '@/hooks/use-company-stats';
import { useRecentClaims } from '@/hooks/use-claims';
import { useBrokerStats, useBrokerCompanyStats, useBrokerClaims } from '@/hooks/use-broker';
import { ClaimStatus, DamageCategory } from '@poa/shared';
import { TimelineChart, CategoryPieChart, VehicleBarChart, QuotaGauge, LazyChart } from '@/components/charts';
import { OnboardingDialog, InlineHelp } from '@/components/help';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  iconBg: string;
  isLoading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon, iconBg, isLoading, trend }: StatCardProps) {
  return (
    <Card className="rounded-2xl border shadow-soft hover:shadow-soft-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : (
          <>
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
          </>
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
    <Link href={href} prefetch={false}>
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

// Status Badge Component
function StatusBadge({ status }: { status: ClaimStatus }) {
  const statusConfig: Record<ClaimStatus, { label: string; className: string }> = {
    [ClaimStatus.DRAFT]: { label: 'Entwurf', className: 'bg-gray-100 text-gray-700' },
    [ClaimStatus.SUBMITTED]: { label: 'Eingereicht', className: 'bg-blue-100 text-blue-700' },
    [ClaimStatus.APPROVED]: { label: 'Freigegeben', className: 'bg-green-100 text-green-700' },
    [ClaimStatus.SENT]: { label: 'Gesendet', className: 'bg-purple-100 text-purple-700' },
    [ClaimStatus.ACKNOWLEDGED]: { label: 'Bestaetigt', className: 'bg-teal-100 text-teal-700' },
    [ClaimStatus.CLOSED]: { label: 'Abgeschlossen', className: 'bg-gray-100 text-gray-700' },
    [ClaimStatus.REJECTED]: { label: 'Abgelehnt', className: 'bg-red-100 text-red-700' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

// Damage Category Label
function getDamageCategoryLabel(category: DamageCategory): string {
  const labels: Record<DamageCategory, string> = {
    [DamageCategory.LIABILITY]: 'Haftpflicht',
    [DamageCategory.COMPREHENSIVE]: 'Kasko',
    [DamageCategory.GLASS]: 'Glas',
    [DamageCategory.WILDLIFE]: 'Wild',
    [DamageCategory.PARKING]: 'Parkschaden',
    [DamageCategory.THEFT]: 'Diebstahl',
    [DamageCategory.VANDALISM]: 'Vandalismus',
    [DamageCategory.OTHER]: 'Sonstiges',
  };
  return labels[category] || category;
}

export default function DashboardPage() {
  const { user, company, activeCompany } = useAuthStore();
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPERADMIN';
  const isBroker = user?.role === 'BROKER';

  // Fetch data for non-brokers
  const { data: companyStats, isLoading: isLoadingCompanyStats } = useCompanyStats();
  const { data: recentClaims, isLoading: isLoadingClaims } = useRecentClaims(5);

  // Fetch data for brokers
  const { data: brokerAggregatedStats, isLoading: isLoadingBrokerStats } = useBrokerStats();
  const { data: brokerCompanyStats, isLoading: isLoadingBrokerCompanyStats } = useBrokerCompanyStats(
    activeCompany?.id || null
  );
  const { data: brokerClaims, isLoading: isLoadingBrokerClaims } = useBrokerClaims(
    activeCompany ? { companyId: activeCompany.id, limit: 5 } : { limit: 5 }
  );

  // Determine which stats to use
  const isLoadingStats = isBroker
    ? (activeCompany ? isLoadingBrokerCompanyStats : isLoadingBrokerStats)
    : isLoadingCompanyStats;

  const stats = isBroker
    ? (activeCompany ? brokerCompanyStats : brokerAggregatedStats)
    : companyStats;

  // Calculate open claims (SUBMITTED + APPROVED)
  const openClaims = stats?.claimsByStatus
    ? (stats.claimsByStatus['SUBMITTED'] || 0) + (stats.claimsByStatus['APPROVED'] || 0)
    : 0;

  // Get display name
  const displayName = isBroker
    ? (activeCompany ? activeCompany.name : 'alle betreuten Firmen')
    : company?.name;

  // Get claims to display
  const claimsToShow = isBroker ? brokerClaims?.data : recentClaims;
  const isClaimsLoading = isBroker ? isLoadingBrokerClaims : isLoadingClaims;

  return (
    <div className="space-y-8 w-full min-w-0">
      {/* Onboarding Dialog */}
      <OnboardingDialog pageKey="dashboard" />

      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Willkommen zurueck, {user?.firstName}!
          </h1>
        </div>
        <p className="text-muted-foreground">
          {isBroker
            ? `Hier ist eine Uebersicht ueber ${displayName}`
            : isAdmin
              ? `Hier ist eine Uebersicht ueber ${company?.name}`
              : 'Hier ist eine Uebersicht ueber Ihre Schaeden'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
        {/* For Broker: Show Companies count when viewing all */}
        {isBroker && !activeCompany && (
          <StatCard
            title="Betreute Firmen"
            value={(brokerAggregatedStats as any)?.totalCompanies ?? 0}
            description="Firmen verknuepft"
            icon={<Building2 className="h-5 w-5 text-indigo-600" />}
            iconBg="bg-indigo-50"
            isLoading={isLoadingBrokerStats}
          />
        )}
        <StatCard
          title="Offene Schaeden"
          value={openClaims}
          description={isBroker ? 'Warten auf Bearbeitung' : isAdmin ? 'Warten auf Bearbeitung' : 'Ihre offenen Schaeden'}
          icon={<AlertCircle className="h-5 w-5 text-orange-600" />}
          iconBg="bg-orange-50"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Schaeden gesamt"
          value={stats?.totalClaims ?? 0}
          description="Dieses Jahr"
          icon={<FileWarning className="h-5 w-5 text-primary" />}
          iconBg="bg-primary/5"
          isLoading={isLoadingStats}
        />
        {(isAdmin || isBroker) && (
          <>
            <StatCard
              title="Fahrzeuge"
              value={stats?.totalVehicles ?? 0}
              description="Aktive Fahrzeuge"
              icon={<Car className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-50"
              isLoading={isLoadingStats}
            />
            {/* Show users count only when company is selected or for admins */}
            {(activeCompany || !isBroker) && (
              <StatCard
                title="Mitarbeiter"
                value={stats?.totalUsers ?? 0}
                description="Aktive Benutzer"
                icon={<Users className="h-5 w-5 text-green-600" />}
                iconBg="bg-green-50"
                isLoading={isLoadingStats}
              />
            )}
          </>
        )}
      </div>

      {/* Charts Section - Only for Admins and Brokers */}
      {/* PERFORMANCE FIX: Charts wrapped in LazyChart for deferred loading */}
      {(isAdmin || isBroker) && !activeCompany && (
        <div className="space-y-6">
          {/* Timeline Chart - Full Width */}
          <LazyChart fallbackTitle="Schadenentwicklung" fallbackHeight="h-[300px]">
            <TimelineChart
              period="month"
              range={12}
              title="Schadenentwicklung (12 Monate)"
              className="rounded-2xl border shadow-soft"
            />
          </LazyChart>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
            {/* Category Pie Chart */}
            <LazyChart fallbackTitle="Schäden nach Kategorie" fallbackHeight="h-[250px]">
              <CategoryPieChart
                title="Schäden nach Kategorie"
                className="rounded-2xl border shadow-soft"
              />
            </LazyChart>

            {/* Vehicle Bar Chart */}
            <LazyChart fallbackTitle="Top 5 Fahrzeuge" fallbackHeight="h-[250px]" className="lg:col-span-2">
              <VehicleBarChart
                limit={5}
                title="Top 5 Fahrzeuge"
                className="rounded-2xl border shadow-soft"
              />
            </LazyChart>
          </div>

          {/* Quota Section */}
          <div className="grid gap-6 lg:grid-cols-4 [&>*]:min-w-0">
            <LazyChart fallbackTitle="Schadenquote" fallbackHeight="h-[200px]">
              <QuotaGauge
                title="Schadenquote"
                className="rounded-2xl border shadow-soft"
              />
            </LazyChart>
            <div className="lg:col-span-3">
              <Card className="rounded-2xl border shadow-soft h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Detaillierte Auswertungen</CardTitle>
                      <CardDescription>Tiefgehende Analysen und Reports</CardDescription>
                    </div>
                    <Link href={'/reports' as Route} prefetch={false}>
                      <Button variant="outline" className="rounded-xl">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Auswertungen öffnen
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border p-4">
                      <div className="text-sm text-muted-foreground">Schäden pro Fahrer</div>
                      <div className="mt-1 text-lg font-semibold">Verfügbar</div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <div className="text-sm text-muted-foreground">Kosten-Analyse</div>
                      <div className="mt-1 text-lg font-semibold">Verfügbar</div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <div className="text-sm text-muted-foreground">Export</div>
                      <div className="mt-1 text-lg font-semibold">CSV & Excel</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-5 [&>*]:min-w-0">
        {/* Quick Actions */}
        <Card className="rounded-2xl border shadow-soft lg:col-span-2 overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-1">
              <CardTitle>Schnellzugriff</CardTitle>
              <InlineHelp topicKey="dashboard-quickactions" />
            </div>
            <CardDescription>Haeufige Aktionen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Broker-specific actions */}
            {isBroker && (
              <QuickAction
                icon={<Building2 className="h-5 w-5" />}
                title="Firmen verwalten"
                description="Betreute Firmen einsehen"
                href={'/broker/companies' as Route}
              />
            )}
            {!isBroker && (
              <QuickAction
                icon={<Plus className="h-5 w-5" />}
                title="Neuen Schaden melden"
                description="Schaden erfassen und dokumentieren"
                href={'/claims/new' as Route}
              />
            )}
            <QuickAction
              icon={<FileWarning className="h-5 w-5" />}
              title="Alle Schaeden"
              description="Schaeden einsehen und verwalten"
              href={'/claims' as Route}
            />
            {(isAdmin || isBroker) && (
              <QuickAction
                icon={<Car className="h-5 w-5" />}
                title="Fahrzeuge"
                description={isBroker ? 'Fahrzeuge einsehen' : 'Fuhrpark bearbeiten'}
                href={'/vehicles' as Route}
              />
            )}
            {isAdmin && (
              <QuickAction
                icon={<Users className="h-5 w-5" />}
                title="Benutzer verwalten"
                description="Team und Berechtigungen"
                href={'/settings/users' as Route}
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Claims */}
        <Card className="rounded-2xl border shadow-soft lg:col-span-3 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle>Letzte Schaeden</CardTitle>
              <CardDescription>
                {isBroker && activeCompany
                  ? `Neueste Schaeden von ${activeCompany.name}`
                  : isBroker
                    ? 'Neueste Schaeden aller Firmen'
                    : 'Die neuesten Schadenmeldungen'}
              </CardDescription>
            </div>
            <Link href={'/claims' as Route} prefetch={false}>
              <Button variant="ghost" size="sm" className="text-primary shrink-0">
                Alle anzeigen
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isClaimsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : claimsToShow && claimsToShow.length > 0 ? (
              <div className="space-y-3">
                {claimsToShow.map((claim: any) => (
                  <Link
                    key={claim.id}
                    href={`/claims/${claim.id}` as Route}
                    prefetch={false}
                    className="block"
                  >
                    <div className="flex items-center justify-between gap-2 rounded-xl border p-4 transition-all hover:border-primary/20 hover:shadow-soft">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <FileWarning className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{claim.claimNumber}</span>
                            <StatusBadge status={claim.status} />
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                            {/* Show company name for broker */}
                            {isBroker && claim.company && (
                              <>
                                <span className="font-medium text-foreground">{claim.company.name}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{claim.vehicle?.licensePlate || claim.vehicle}</span>
                            <span>•</span>
                            <span>{getDamageCategoryLabel(claim.damageCategory)}</span>
                            <span>•</span>
                            <span>{new Date(claim.accidentDate).toLocaleDateString('de-DE')}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium">Noch keine Schaeden</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  {isBroker
                    ? 'Es wurden noch keine Schaeden von den betreuten Firmen gemeldet.'
                    : 'Erstellen Sie Ihren ersten Schaden, um hier die neuesten Meldungen zu sehen.'}
                </p>
                {!isBroker && (
                  <Link href={'/claims/new' as Route} prefetch={false} className="mt-6">
                    <Button className="rounded-xl">
                      <Plus className="mr-2 h-4 w-4" />
                      Ersten Schaden melden
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
