'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { useCreateVehicle } from '@/hooks/use-vehicles';
import { toast } from 'sonner';

export default function NewVehiclePage() {
  const router = useRouter();
  const createVehicle = useCreateVehicle();

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      await createVehicle.mutateAsync(data as unknown as Parameters<typeof createVehicle.mutateAsync>[0]);
      toast.success('Fahrzeug erfolgreich erstellt');
      router.push('/vehicles' as Route);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Fehler beim Erstellen';
      toast.error(message);
    }
  };

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
            Neues Fahrzeug
          </h1>
          <p className="text-muted-foreground">
            Fügen Sie ein neues Fahrzeug zu Ihrem Fuhrpark hinzu
          </p>
        </div>
      </div>

      {/* Form */}
      <VehicleForm onSubmit={handleSubmit} isLoading={createVehicle.isPending} />
    </div>
  );
}
