'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { useVehicle, useUpdateVehicle } from '@/hooks/use-vehicles';
import { toast } from 'sonner';

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: vehicle, isLoading: isLoadingVehicle, error } = useVehicle(id);
  const updateVehicle = useUpdateVehicle();

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      await updateVehicle.mutateAsync({
        id,
        data: data as Parameters<typeof updateVehicle.mutateAsync>[0]['data'],
      });
      toast.success('Fahrzeug erfolgreich aktualisiert');
      router.push('/vehicles' as Route);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Fehler beim Aktualisieren';
      toast.error(message);
    }
  };

  if (isLoadingVehicle) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-600 mb-4">Fahrzeug nicht gefunden</p>
        <Link href={'/vehicles' as Route}>
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Liste
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={'/vehicles' as Route}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {vehicle.licensePlate}
          </h1>
          <p className="text-muted-foreground">
            {vehicle.brand && vehicle.model
              ? `${vehicle.brand} ${vehicle.model}`
              : 'Fahrzeug bearbeiten'}
          </p>
        </div>
      </div>

      {/* Form */}
      <VehicleForm
        vehicle={vehicle}
        onSubmit={handleSubmit}
        isLoading={updateVehicle.isPending}
      />
    </div>
  );
}
