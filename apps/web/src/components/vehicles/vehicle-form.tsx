'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { VehicleType } from '@poa/shared';
import type { Vehicle } from '@poa/shared';

const vehicleSchema = z.object({
  licensePlate: z
    .string()
    .min(1, 'Kennzeichen ist erforderlich')
    .max(20, 'Kennzeichen darf maximal 20 Zeichen haben')
    .transform((val) => val.toUpperCase().replace(/\s/g, '-')),
  brand: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
  model: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
  year: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().int().min(1900).max(new Date().getFullYear() + 1).optional()
  ),
  vin: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform(val => val || undefined)
    .refine(
      (val) => !val || val.length === 0 || (val.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(val)),
      'FIN muss genau 17 Zeichen haben'
    ),
  hsn: z.string().max(10).optional().or(z.literal('')).transform(val => val || undefined),
  tsn: z.string().max(10).optional().or(z.literal('')).transform(val => val || undefined),
  internalName: z.string().max(100).optional().or(z.literal('')).transform(val => val || undefined),
  vehicleType: z.nativeEnum(VehicleType).default(VehicleType.CAR),
  color: z.string().max(50).optional().or(z.literal('')).transform(val => val || undefined),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

const vehicleTypeOptions = [
  { value: VehicleType.CAR, label: 'PKW' },
  { value: VehicleType.TRUCK, label: 'LKW' },
  { value: VehicleType.VAN, label: 'Transporter' },
  { value: VehicleType.MOTORCYCLE, label: 'Motorrad' },
  { value: VehicleType.OTHER, label: 'Sonstiges' },
];

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  isLoading?: boolean;
}

export function VehicleForm({ vehicle, onSubmit, isLoading }: VehicleFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      licensePlate: vehicle?.licensePlate || '',
      brand: vehicle?.brand || '',
      model: vehicle?.model || '',
      year: vehicle?.year || undefined,
      vin: vehicle?.vin || '',
      hsn: vehicle?.hsn || '',
      tsn: vehicle?.tsn || '',
      internalName: vehicle?.internalName || '',
      vehicleType: vehicle?.vehicleType || VehicleType.CAR,
      color: vehicle?.color || '',
    },
  });

  const vehicleType = watch('vehicleType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Hauptdaten */}
      <Card className="rounded-2xl border shadow-soft">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Fahrzeugdaten</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="licensePlate">
                Kennzeichen <span className="text-red-500">*</span>
              </Label>
              <Input
                id="licensePlate"
                {...register('licensePlate')}
                placeholder="z.B. B-AB-1234"
                className="rounded-xl uppercase"
              />
              {errors.licensePlate && (
                <p className="text-sm text-red-500">{errors.licensePlate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleType">Fahrzeugtyp</Label>
              <Select
                value={vehicleType}
                onValueChange={(value) => setValue('vehicleType', value as VehicleType)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Fahrzeugtyp waehlen" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Marke</Label>
              <Input
                id="brand"
                {...register('brand')}
                placeholder="z.B. Volkswagen"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modell</Label>
              <Input
                id="model"
                {...register('model')}
                placeholder="z.B. Transporter T6"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Baujahr</Label>
              <Input
                id="year"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                {...register('year')}
                placeholder="z.B. 2022"
                className="rounded-xl"
              />
              {errors.year && (
                <p className="text-sm text-red-500">{errors.year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Farbe</Label>
              <Input
                id="color"
                {...register('color')}
                placeholder="z.B. Weiss"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="internalName">Interner Name / Bezeichnung</Label>
              <Input
                id="internalName"
                {...register('internalName')}
                placeholder="z.B. Lieferwagen 01"
                className="rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technische Daten */}
      <Card className="rounded-2xl border shadow-soft">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Technische Daten</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="vin">FIN (Fahrzeug-Identnummer)</Label>
              <Input
                id="vin"
                {...register('vin')}
                placeholder="17 Zeichen"
                className="rounded-xl uppercase"
                maxLength={17}
              />
              {errors.vin && (
                <p className="text-sm text-red-500">{errors.vin.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hsn">HSN (Herstellerschluessel)</Label>
              <Input
                id="hsn"
                {...register('hsn')}
                placeholder="z.B. 0603"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tsn">TSN (Typschluessel)</Label>
              <Input
                id="tsn"
                {...register('tsn')}
                placeholder="z.B. BDK"
                className="rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="submit" className="rounded-xl" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {vehicle ? 'Speichern' : 'Fahrzeug erstellen'}
        </Button>
      </div>
    </form>
  );
}
