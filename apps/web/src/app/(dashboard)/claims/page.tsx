'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Plus,
  Search,
  FileWarning,
  MoreHorizontal,
  Eye,
  Loader2,
  Filter,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClaims } from '@/hooks/use-claims';
import { useBrokerClaims } from '@/hooks/use-broker';
import { useAuthStore } from '@/stores/auth-store';
import { ClaimStatus, DamageCategory } from '@poa/shared';
import { ExportButton } from '@/components/claims/export-button';

const statusLabels: Record<ClaimStatus, string> = {
  [ClaimStatus.DRAFT]: 'Entwurf',
  [ClaimStatus.SUBMITTED]: 'Eingereicht',
  [ClaimStatus.APPROVED]: 'Genehmigt',
  [ClaimStatus.SENT]: 'Gesendet',
  [ClaimStatus.ACKNOWLEDGED]: 'Bestaetigt',
  [ClaimStatus.CLOSED]: 'Abgeschlossen',
  [ClaimStatus.REJECTED]: 'Abgelehnt',
};

const statusColors: Record<ClaimStatus, string> = {
  [ClaimStatus.DRAFT]: 'bg-gray-100 text-gray-700',
  [ClaimStatus.SUBMITTED]: 'bg-blue-100 text-blue-700',
  [ClaimStatus.APPROVED]: 'bg-green-100 text-green-700',
  [ClaimStatus.SENT]: 'bg-purple-100 text-purple-700',
  [ClaimStatus.ACKNOWLEDGED]: 'bg-teal-100 text-teal-700',
  [ClaimStatus.CLOSED]: 'bg-gray-100 text-gray-700',
  [ClaimStatus.REJECTED]: 'bg-red-100 text-red-700',
};

const damageCategoryLabels: Record<DamageCategory, string> = {
  [DamageCategory.LIABILITY]: 'Haftpflicht',
  [DamageCategory.COMPREHENSIVE]: 'Kasko',
  [DamageCategory.GLASS]: 'Glasschaden',
  [DamageCategory.WILDLIFE]: 'Wildschaden',
  [DamageCategory.PARKING]: 'Parkschaden',
  [DamageCategory.THEFT]: 'Diebstahl',
  [DamageCategory.VANDALISM]: 'Vandalismus',
  [DamageCategory.OTHER]: 'Sonstiges',
};

export default function ClaimsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { user, activeCompany } = useAuthStore();
  const isBroker = user?.role === 'BROKER';
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPERADMIN';

  // Use different hooks based on role
  const { data: regularClaims, isLoading: isLoadingRegular, error: regularError } = useClaims();
  const { data: brokerClaimsData, isLoading: isLoadingBroker, error: brokerError } = useBrokerClaims(
    activeCompany ? { companyId: activeCompany.id, search } : { search }
  );

  // Select the right data based on role
  const claims = isBroker ? brokerClaimsData?.data : regularClaims;
  const isLoading = isBroker ? isLoadingBroker : isLoadingRegular;
  const error = isBroker ? brokerError : regularError;

  // Filter claims (client-side filtering for non-broker, broker uses server-side)
  const filteredClaims = claims?.filter((claim: any) => {
    // For broker, search is handled server-side
    const matchesSearch = isBroker ? true :
      !search ||
      claim.claimNumber.toLowerCase().includes(search.toLowerCase()) ||
      claim.vehicle.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      claim.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: de });
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Fehler beim Laden der Schaeden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Schaeden</h1>
          <p className="text-muted-foreground">
            {isBroker
              ? activeCompany
                ? `Schaeden von ${activeCompany.name}`
                : 'Schaeden aller betreuten Firmen'
              : 'Verwalten Sie Ihre Schadensmeldungen'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(isAdmin || isBroker) && <ExportButton />}
          {!isBroker && (
            <Link href={'/claims/new' as Route}>
              <Button className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Neuen Schaden melden
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Schadennummer, Kennzeichen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue placeholder="Status filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border shadow-soft">
        <CardHeader>
          <CardTitle>Schadensliste</CardTitle>
          <CardDescription>
            {filteredClaims?.length ?? 0} Schaden/Schaeden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClaims && filteredClaims.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schadennummer</TableHead>
                    {/* Company column for broker */}
                    {isBroker && <TableHead>Firma</TableHead>}
                    <TableHead>Fahrzeug</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Unfalldatum</TableHead>
                    <TableHead>Gesch. Kosten</TableHead>
                    <TableHead>Melder</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim: any) => (
                    <TableRow key={claim.id}>
                      <TableCell>
                        <Link
                          href={`/claims/${claim.id}` as Route}
                          className="font-medium text-primary hover:underline"
                        >
                          {claim.claimNumber}
                        </Link>
                      </TableCell>
                      {/* Company cell for broker */}
                      {isBroker && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{claim.company?.name || '-'}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        {claim.vehicle?.licensePlate || claim.vehicle}
                        {claim.vehicle?.brand && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ({claim.vehicle.brand} {claim.vehicle.model})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{damageCategoryLabels[claim.damageCategory as DamageCategory]}</TableCell>
                      <TableCell>{formatDate(claim.accidentDate)}</TableCell>
                      <TableCell>{formatCurrency(claim.estimatedCost)}</TableCell>
                      <TableCell>
                        {claim.reporter?.firstName} {claim.reporter?.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[claim.status as ClaimStatus]} variant="secondary">
                          {statusLabels[claim.status as ClaimStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/claims/${claim.id}` as Route}>
                                <Eye className="mr-2 h-4 w-4" />
                                Details anzeigen
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <FileWarning className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Keine Schaeden gefunden</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                {search || statusFilter !== 'all'
                  ? 'Keine Schaeden entsprechen Ihren Filterkriterien.'
                  : 'Melden Sie Ihren ersten Schaden.'}
              </p>
              {!search && statusFilter === 'all' && (
                <Link href={'/claims/new' as Route} className="mt-6">
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
  );
}
