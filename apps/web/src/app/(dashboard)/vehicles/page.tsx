'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Plus, Search, Car, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2, Loader2, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useVehicles, useDeactivateVehicle, useActivateVehicle, useDeleteVehicle } from '@/hooks/use-vehicles';
import { useAuthStore } from '@/stores/auth-store';
import { VehicleType } from '@poa/shared';
import type { Vehicle } from '@poa/shared';
import { toast } from 'sonner';
import { OnboardingDialog, InlineHelp } from '@/components/help';

const vehicleTypeLabels: Record<VehicleType, string> = {
  [VehicleType.CAR]: 'PKW',
  [VehicleType.TRUCK]: 'LKW',
  [VehicleType.VAN]: 'Transporter',
  [VehicleType.MOTORCYCLE]: 'Motorrad',
  [VehicleType.OTHER]: 'Sonstiges',
};

export default function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [hideInactive, setHideInactive] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const { user, activeCompany } = useAuthStore();
  const isBroker = user?.role === 'BROKER';
  const canManageVehicles = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPERADMIN';

  const { data: vehicles, isLoading, error } = useVehicles();
  const deactivateVehicle = useDeactivateVehicle();
  const activateVehicle = useActivateVehicle();
  const deleteVehicle = useDeleteVehicle();

  // Broker must select a company first
  if (isBroker && !activeCompany) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium">Keine Firma ausgewaehlt</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          Bitte waehlen Sie zuerst eine Firma aus, um deren Fahrzeuge anzuzeigen.
        </p>
        <Link href={'/broker/companies' as Route} prefetch={false} className="mt-6">
          <Button className="rounded-xl">
            Firma auswaehlen
          </Button>
        </Link>
      </div>
    );
  }

  // Filter vehicles
  const filteredVehicles = vehicles?.filter((vehicle) => {
    const matchesSearch =
      !search ||
      vehicle.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.internalName?.toLowerCase().includes(search.toLowerCase());

    const matchesActive = !hideInactive || vehicle.isActive;

    return matchesSearch && matchesActive;
  });

  const handleDeactivate = async (id: string) => {
    console.log('handleDeactivate called with id:', id);
    try {
      const result = await deactivateVehicle.mutateAsync(id);
      console.log('deactivate result:', result);
      toast.success('Fahrzeug deaktiviert');
    } catch (err) {
      console.error('deactivate error:', err);
      toast.error('Fehler beim Deaktivieren des Fahrzeugs');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateVehicle.mutateAsync(id);
      toast.success('Fahrzeug aktiviert');
    } catch {
      toast.error('Fehler beim Aktivieren des Fahrzeugs');
    }
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      await deleteVehicle.mutateAsync(vehicleToDelete.id);
      toast.success('Fahrzeug erfolgreich geloescht');
      setVehicleToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Fehler beim Loeschen des Fahrzeugs';
      toast.error(message);
      setVehicleToDelete(null);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Fehler beim Laden der Fahrzeuge</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Dialog */}
      <OnboardingDialog pageKey="vehicles" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Fahrzeuge</h1>
            <InlineHelp topicKey="vehicles-list" />
          </div>
          <p className="text-muted-foreground">
            {isBroker && activeCompany
              ? `Fahrzeuge von ${activeCompany.name}`
              : 'Verwalten Sie Ihren Fuhrpark'}
          </p>
        </div>
        {canManageVehicles && (
          <Link href={'/vehicles/new' as Route} prefetch={false}>
            <Button className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Neues Fahrzeug
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Kennzeichen, Marke, Modell..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Button
              variant={hideInactive ? 'default' : 'outline'}
              onClick={() => setHideInactive(!hideInactive)}
              className="rounded-xl"
            >
              {hideInactive ? 'Alle anzeigen' : 'Inaktive ausblenden'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border shadow-soft">
        <CardHeader>
          <CardTitle>Fahrzeugliste</CardTitle>
          <CardDescription>
            {filteredVehicles?.length ?? 0} Fahrzeug(e)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVehicles && filteredVehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kennzeichen</TableHead>
                    <TableHead>Fahrzeug</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Int. Name</TableHead>
                    <TableHead>Baujahr</TableHead>
                    <TableHead>Status</TableHead>
                    {canManageVehicles && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} className={!vehicle.isActive ? 'opacity-50' : ''}>
                      <TableCell>
                        <Link
                          href={`/vehicles/${vehicle.id}` as Route}
                          prefetch={false}
                          className="font-medium text-primary hover:underline"
                        >
                          {vehicle.licensePlate}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {vehicle.brand && vehicle.model
                          ? `${vehicle.brand} ${vehicle.model}`
                          : vehicle.brand || vehicle.model || '-'}
                      </TableCell>
                      <TableCell>{vehicleTypeLabels[vehicle.vehicleType]}</TableCell>
                      <TableCell>{vehicle.internalName || '-'}</TableCell>
                      <TableCell>{vehicle.year || '-'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            vehicle.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {vehicle.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </TableCell>
                      {canManageVehicles && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/vehicles/${vehicle.id}` as Route} prefetch={false}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Bearbeiten
                                </Link>
                              </DropdownMenuItem>
                              {vehicle.isActive ? (
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleDeactivate(vehicle.id);
                                  }}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Deaktivieren
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleActivate(vehicle.id);
                                  }}
                                >
                                  <ArchiveRestore className="mr-2 h-4 w-4" />
                                  Aktivieren
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onSelect={() => setVehicleToDelete(vehicle)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Loeschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Car className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Keine Fahrzeuge gefunden</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                {search
                  ? 'Keine Fahrzeuge entsprechen Ihrer Suche.'
                  : 'Erstellen Sie Ihr erstes Fahrzeug.'}
              </p>
              {!search && canManageVehicles && (
                <Link href={'/vehicles/new' as Route} prefetch={false} className="mt-6">
                  <Button className="rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Erstes Fahrzeug erstellen
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!vehicleToDelete}
        onOpenChange={(open) => !open && setVehicleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fahrzeug loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Moechten Sie das Fahrzeug &quot;{vehicleToDelete?.licensePlate}&quot; wirklich
              loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.
              <br /><br />
              <strong>Hinweis:</strong> Fahrzeuge mit zugeordneten Schaeden koennen nicht
              geloescht werden. In diesem Fall deaktivieren Sie das Fahrzeug stattdessen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVehicle.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Loeschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
