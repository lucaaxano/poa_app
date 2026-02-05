'use client';

import { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ChevronLeft, ChevronRight, Edit, Trash2, Shield } from 'lucide-react';
import {
  useAdminInsurers,
  useCreateInsurer,
  useUpdateInsurer,
  useDeleteInsurer,
} from '@/hooks/use-admin';
import type { Insurer, CreateInsurerDto, UpdateInsurerDto } from '@/lib/api/admin';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AdminInsurersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInsurer, setEditingInsurer] = useState<Insurer | null>(null);
  const [deletingInsurer, setDeletingInsurer] = useState<Insurer | null>(null);

  const { data, isLoading, error } = useAdminInsurers({
    search: search || undefined,
    isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
    page,
    limit,
  });

  const createMutation = useCreateInsurer();
  const updateMutation = useUpdateInsurer();
  const deleteMutation = useDeleteInsurer();

  const handleCreate = async (data: CreateInsurerDto | UpdateInsurerDto) => {
    try {
      await createMutation.mutateAsync(data as CreateInsurerDto);
      toast.success('Versicherer erstellt');
      setIsCreateOpen(false);
    } catch {
      toast.error('Fehler beim Erstellen des Versicherers');
    }
  };

  const handleUpdate = async (id: string, data: UpdateInsurerDto) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      toast.success('Versicherer aktualisiert');
      setEditingInsurer(null);
    } catch {
      toast.error('Fehler beim Aktualisieren des Versicherers');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Versicherer gelöscht/deaktiviert');
      setDeletingInsurer(null);
    } catch {
      toast.error('Fehler beim Löschen des Versicherers');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Versicherer</h1>
          <p className="text-muted-foreground">
            Globale Versicherer-Datenbank verwalten
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Versicherer hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <InsurerForm
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Suche nach Name oder E-Mail..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Versichererliste</CardTitle>
          <CardDescription>
            {data?.total ?? 0} Versicherer gefunden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-destructive">
              Fehler beim Laden der Versicherer
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail (Schaden)</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Keine Versicherer gefunden
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((insurer) => (
                      <TableRow key={insurer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Shield className="h-5 w-5" />
                            </div>
                            <span className="font-medium">{insurer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{insurer.claimsEmail}</TableCell>
                        <TableCell>{insurer.contactPhone || '-'}</TableCell>
                        <TableCell>
                          {insurer.website ? (
                            <a
                              href={insurer.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate max-w-[200px] block"
                            >
                              {insurer.website}
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={insurer.isActive ? 'default' : 'secondary'}>
                            {insurer.isActive ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingInsurer(insurer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingInsurer(insurer)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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

      {/* Edit Dialog */}
      <Dialog open={!!editingInsurer} onOpenChange={() => setEditingInsurer(null)}>
        <DialogContent>
          {editingInsurer && (
            <InsurerForm
              insurer={editingInsurer}
              onSubmit={(data) => handleUpdate(editingInsurer.id, data)}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingInsurer(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingInsurer} onOpenChange={() => setDeletingInsurer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Versicherer löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie den Versicherer &quot;{deletingInsurer?.name}&quot; wirklich löschen?
              Wenn der Versicherer in Policen verwendet wird, wird er stattdessen deaktiviert.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingInsurer(null)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingInsurer && handleDelete(deletingInsurer.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Insurer Form Component
function InsurerForm({
  insurer,
  onSubmit,
  isLoading,
  onCancel,
}: {
  insurer?: Insurer;
  onSubmit: (data: CreateInsurerDto | UpdateInsurerDto) => void;
  isLoading: boolean;
  onCancel: () => void;
}) {
  const [name, setName] = useState(insurer?.name || '');
  const [claimsEmail, setClaimsEmail] = useState(insurer?.claimsEmail || '');
  const [contactPhone, setContactPhone] = useState(insurer?.contactPhone || '');
  const [website, setWebsite] = useState(insurer?.website || '');
  const [isActive, setIsActive] = useState(insurer?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      claimsEmail,
      contactPhone: contactPhone || undefined,
      website: website || undefined,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {insurer ? 'Versicherer bearbeiten' : 'Versicherer hinzufügen'}
        </DialogTitle>
        <DialogDescription>
          {insurer
            ? 'Bearbeiten Sie die Daten des Versicherers.'
            : 'Fügen Sie einen neuen Versicherer zur Datenbank hinzu.'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Allianz Versicherung"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="claimsEmail">E-Mail (Schaden) *</Label>
          <Input
            id="claimsEmail"
            type="email"
            value={claimsEmail}
            onChange={(e) => setClaimsEmail(e.target.value)}
            placeholder="schaden@versicherung.de"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Telefon</Label>
          <Input
            id="contactPhone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+49 800 123456"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://www.versicherung.de"
          />
        </div>
        {insurer && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="isActive">Aktiv</Label>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isLoading || !name || !claimsEmail}>
          {isLoading ? 'Speichern...' : 'Speichern'}
        </Button>
      </DialogFooter>
    </form>
  );
}
