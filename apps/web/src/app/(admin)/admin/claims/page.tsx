'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Eye, ExternalLink } from 'lucide-react';
import { useAdminClaims, useAdminCompanies } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CLAIM_STATUS_LABELS, DAMAGE_CATEGORY_LABELS, ClaimStatus } from '@poa/shared';

export default function AdminClaimsPage() {
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: companiesData } = useAdminCompanies({ limit: 100 });

  const { data, isLoading, error } = useAdminClaims({
    search: search || undefined,
    companyId: companyFilter !== 'all' ? companyFilter : undefined,
    status: statusFilter !== 'all' ? (statusFilter as ClaimStatus) : undefined,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schaeden</h1>
        <p className="text-muted-foreground">
          Alle Schaeden im System einsehen
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Suche nach Schadennummer oder Kennzeichen..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={companyFilter}
              onValueChange={(value) => {
                setCompanyFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Firma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Firmen</SelectItem>
                {companiesData?.data.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="DRAFT">Entwurf</SelectItem>
                <SelectItem value="SUBMITTED">Eingereicht</SelectItem>
                <SelectItem value="APPROVED">Genehmigt</SelectItem>
                <SelectItem value="SENT">Gesendet</SelectItem>
                <SelectItem value="ACKNOWLEDGED">Bestaetigt</SelectItem>
                <SelectItem value="CLOSED">Geschlossen</SelectItem>
                <SelectItem value="REJECTED">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Schadenliste</CardTitle>
          <CardDescription>
            {data?.total ?? 0} Schaeden gefunden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-destructive">
              Fehler beim Laden der Schaeden
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schadennummer</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Fahrzeug</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Unfalldatum</TableHead>
                    <TableHead className="text-right">Kosten</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Keine Schaeden gefunden
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-mono font-medium">
                          {claim.claimNumber}
                        </TableCell>
                        <TableCell>{claim.company.name}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{claim.vehicle.licensePlate}</div>
                            <div className="text-sm text-muted-foreground">
                              {claim.vehicle.brand} {claim.vehicle.model}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {DAMAGE_CATEGORY_LABELS[claim.damageCategory as keyof typeof DAMAGE_CATEGORY_LABELS] || claim.damageCategory}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={claim.status} />
                        </TableCell>
                        <TableCell>{formatDate(claim.accidentDate)}</TableCell>
                        <TableCell className="text-right">
                          {claim.finalCost
                            ? formatCurrency(claim.finalCost)
                            : claim.estimatedCost
                              ? formatCurrency(claim.estimatedCost)
                              : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/claims/${claim.id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Seite {page} von {data.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    DRAFT: 'outline',
    SUBMITTED: 'secondary',
    APPROVED: 'default',
    SENT: 'default',
    ACKNOWLEDGED: 'default',
    CLOSED: 'secondary',
    REJECTED: 'destructive',
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {CLAIM_STATUS_LABELS[status as keyof typeof CLAIM_STATUS_LABELS] || status}
    </Badge>
  );
}
