'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth-store';
import {
  useStatsTimeline,
  useStatsByVehicle,
  useStatsByDriver,
  useStatsByCategory,
  useQuotaStats,
} from '@/hooks/use-company-stats';
import { TimelineChart, CategoryPieChart, VehicleBarChart, QuotaGauge, LazyChart } from '@/components/charts';
import { ExportButton } from '@/components/claims/export-button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Users, Car, TrendingUp, PieChart } from 'lucide-react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const CATEGORY_LABELS: Record<string, string> = {
  LIABILITY: 'Haftpflicht',
  COMPREHENSIVE: 'Kasko',
  GLASS: 'Glas',
  WILDLIFE: 'Wild',
  PARKING: 'Parkschaden',
  THEFT: 'Diebstahl',
  VANDALISM: 'Vandalismus',
  OTHER: 'Sonstiges',
};

export default function ReportsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPERADMIN';
  const isBroker = user?.role === 'BROKER';

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [timelinePeriod, setTimelinePeriod] = useState<'week' | 'month'>('month');

  // Fetch all stats
  const { data: vehicleStats, isLoading: isLoadingVehicles } = useStatsByVehicle(20);
  const { data: driverStats, isLoading: isLoadingDrivers } = useStatsByDriver(20);
  const { data: categoryStats, isLoading: isLoadingCategories } = useStatsByCategory();
  const { data: quotaStats, isLoading: isLoadingQuota } = useQuotaStats(selectedYear);

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (!isAdmin && !isBroker) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="p-6">
          <CardTitle>Keine Berechtigung</CardTitle>
          <CardDescription className="mt-2">
            Auswertungen sind nur für Administratoren und Broker verfügbar.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Auswertungen</h1>
          <p className="text-muted-foreground">
            Detaillierte Analysen und Reports Ihrer Schadendaten
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px] rounded-xl">
              <SelectValue placeholder="Jahr" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportButton />
        </div>
      </div>

      {/* Quota Overview */}
      <div className="grid gap-6 lg:grid-cols-4">
        <QuotaGauge
          year={selectedYear}
          title={`Schadenquote ${selectedYear}`}
          className="rounded-2xl border shadow-soft"
        />
        <Card className="rounded-2xl border shadow-soft lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monatliche Kostenentwicklung
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingQuota ? (
              <Skeleton className="h-[200px] w-full" />
            ) : quotaStats ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Monat</TableHead>
                      <TableHead className="text-right">Anzahl</TableHead>
                      <TableHead className="text-right">Kosten</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotaStats.monthlyData.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">
                          {new Date(month.month + '-01').toLocaleDateString('de-DE', {
                            month: 'long',
                          })}
                        </TableCell>
                        <TableCell className="text-right">{month.claimCount}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(month.claimCost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Keine Daten verfügbar
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="rounded-2xl border shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Schadenentwicklung
            </CardTitle>
            <Select
              value={timelinePeriod}
              onValueChange={(value) => setTimelinePeriod(value as 'week' | 'month')}
            >
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monatlich</SelectItem>
                <SelectItem value="week">Wöchentlich</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <LazyChart fallbackTitle="Schadenentwicklung" fallbackHeight="h-[300px]">
            <TimelineChart
              period={timelinePeriod}
              range={timelinePeriod === 'month' ? 12 : 26}
              showCosts={true}
              className="border-0 shadow-none"
            />
          </LazyChart>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="category" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="category" className="rounded-lg">
            <PieChart className="mr-2 h-4 w-4" />
            Nach Kategorie
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="rounded-lg">
            <Car className="mr-2 h-4 w-4" />
            Nach Fahrzeug
          </TabsTrigger>
          <TabsTrigger value="drivers" className="rounded-lg">
            <Users className="mr-2 h-4 w-4" />
            Nach Fahrer
          </TabsTrigger>
        </TabsList>

        {/* Category Tab */}
        <TabsContent value="category" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <LazyChart fallbackTitle="Verteilung nach Kategorie" fallbackHeight="h-[280px]">
              <CategoryPieChart
                title="Verteilung nach Schadenkategorie"
                className="rounded-2xl border shadow-soft"
              />
            </LazyChart>
            <Card className="rounded-2xl border shadow-soft">
              <CardHeader>
                <CardTitle>Kategorie-Details</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCategories ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : categoryStats && categoryStats.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategorie</TableHead>
                        <TableHead className="text-right">Anzahl</TableHead>
                        <TableHead className="text-right">Anteil</TableHead>
                        <TableHead className="text-right">Kosten</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryStats.map((cat) => (
                        <TableRow key={cat.category}>
                          <TableCell className="font-medium">
                            {CATEGORY_LABELS[cat.category] || cat.category}
                          </TableCell>
                          <TableCell className="text-right">{cat.claimCount}</TableCell>
                          <TableCell className="text-right">{cat.percentage}%</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(cat.totalCost)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Keine Daten verfügbar
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <LazyChart fallbackTitle="Top 10 Fahrzeuge" fallbackHeight="h-[300px]">
              <VehicleBarChart
                limit={10}
                title="Top 10 Fahrzeuge nach Schäden"
                className="rounded-2xl border shadow-soft"
              />
            </LazyChart>
            <Card className="rounded-2xl border shadow-soft">
              <CardHeader>
                <CardTitle>Alle Fahrzeuge mit Schäden</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingVehicles ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : vehicleStats && vehicleStats.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kennzeichen</TableHead>
                          <TableHead>Fahrzeug</TableHead>
                          <TableHead className="text-right">Schäden</TableHead>
                          <TableHead className="text-right">Kosten</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehicleStats.map((vehicle) => (
                          <TableRow key={vehicle.vehicleId}>
                            <TableCell className="font-medium">
                              {vehicle.licensePlate}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {[vehicle.brand, vehicle.model].filter(Boolean).join(' ') ||
                                '-'}
                            </TableCell>
                            <TableCell className="text-right">{vehicle.claimCount}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(vehicle.totalCost)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Keine Daten verfügbar
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-6">
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Schäden nach Fahrer
              </CardTitle>
              <CardDescription>
                Übersicht aller Fahrer mit zugeordneten Schäden
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDrivers ? (
                <Skeleton className="h-[300px] w-full" />
              ) : driverStats && driverStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fahrer</TableHead>
                      <TableHead className="text-right">Anzahl Schäden</TableHead>
                      <TableHead className="text-right">Gesamtkosten</TableHead>
                      <TableHead className="text-right">Durchschnitt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverStats.map((driver) => (
                      <TableRow key={driver.userId}>
                        <TableCell className="font-medium">
                          {driver.firstName} {driver.lastName}
                        </TableCell>
                        <TableCell className="text-right">{driver.claimCount}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(driver.totalCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            driver.claimCount > 0 ? driver.totalCost / driver.claimCount : 0
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Keine Daten verfügbar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
