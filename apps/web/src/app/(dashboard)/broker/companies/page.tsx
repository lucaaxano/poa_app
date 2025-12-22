'use client';

import { Building2, Car, FileWarning, Users, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrokerCompanies, useBrokerStats } from '@/hooks/use-broker';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

export default function BrokerCompaniesPage() {
  const router = useRouter();
  const { user, setActiveCompany } = useAuthStore();
  const { data: companies, isLoading: isLoadingCompanies } = useBrokerCompanies();
  const { data: stats, isLoading: isLoadingStats } = useBrokerStats();

  // Redirect if not a broker
  if (user?.role !== 'BROKER') {
    router.push('/dashboard');
    return null;
  }

  const handleSelectCompany = (company: any) => {
    setActiveCompany(company);
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Betreute Firmen</h1>
        <p className="text-muted-foreground">
          Uebersicht aller Firmen, die Sie als Broker betreuen
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Firmen
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtschaeden
            </CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalClaims || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fahrzeuge
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalVehicles || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mitarbeiter
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <Card className="rounded-xl shadow-soft">
        <CardHeader>
          <CardTitle>Firmen-Uebersicht</CardTitle>
          <CardDescription>
            Klicken Sie auf eine Firma, um deren Details anzuzeigen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCompanies ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : companies && companies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead>Stadt</TableHead>
                  <TableHead className="text-center">Fahrzeuge</TableHead>
                  <TableHead className="text-center">Schaeden</TableHead>
                  <TableHead className="text-center">Offene</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSelectCompany(company)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company.city || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {company.totalVehicles}
                    </TableCell>
                    <TableCell className="text-center">
                      {company.totalClaims}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={company.pendingClaims > 0 ? 'destructive' : 'secondary'}
                        className="min-w-[2rem]"
                      >
                        {company.pendingClaims}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCompany(company);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Oeffnen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Keine Firmen verknuepft</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sie wurden noch von keiner Firma als Broker eingeladen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claims by Company Chart Placeholder */}
      {stats && stats.claimsByCompany.length > 0 && (
        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle>Schaeden nach Firma</CardTitle>
            <CardDescription>
              Verteilung der Schaeden auf die betreuten Firmen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.claimsByCompany.map((item) => {
                const percentage =
                  stats.totalClaims > 0
                    ? Math.round((item.claimCount / stats.totalClaims) * 100)
                    : 0;
                return (
                  <div key={item.companyId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.companyName}</span>
                      <span className="text-muted-foreground">
                        {item.claimCount} Schaeden ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
