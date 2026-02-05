'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Car,
  MapPin,
  FileText,
  AlertTriangle,
  Loader2,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVehicles } from '@/hooks/use-vehicles';
import { useUsers } from '@/hooks/use-users';
import { usePolicies } from '@/hooks/use-policies';
import { useClaim, useUpdateClaim } from '@/hooks/use-claims';
import { DamageCategory, ClaimStatus } from '@poa/shared';

const damageCategoryLabels: Record<DamageCategory, string> = {
  [DamageCategory.LIABILITY]: 'Haftpflichtschaden',
  [DamageCategory.COMPREHENSIVE]: 'Kaskoschaden',
  [DamageCategory.GLASS]: 'Glasschaden',
  [DamageCategory.WILDLIFE]: 'Wildschaden',
  [DamageCategory.PARKING]: 'Parkschaden',
  [DamageCategory.THEFT]: 'Diebstahl',
  [DamageCategory.VANDALISM]: 'Vandalismus',
  [DamageCategory.OTHER]: 'Sonstiges',
};

interface ClaimFormData {
  vehicleId: string;
  policyId?: string;
  driverUserId?: string;
  accidentDate: string;
  accidentTime?: string;
  accidentLocation?: string;
  damageCategory: DamageCategory;
  damageSubcategory?: string;
  description?: string;
  policeInvolved: boolean;
  policeFileNumber?: string;
  hasInjuries: boolean;
  injuryDetails?: string;
  estimatedCost?: number;
  // Third party info
  thirdPartyLicensePlate?: string;
  thirdPartyOwnerName?: string;
  thirdPartyPhone?: string;
  thirdPartyInsurer?: string;
}

export default function EditClaimPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;

  const { data: claim, isLoading: claimLoading } = useClaim(claimId);
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: policies, isLoading: policiesLoading } = usePolicies();
  const updateClaim = useUpdateClaim();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClaimFormData>();

  // Pre-fill form when claim data is loaded
  useEffect(() => {
    if (claim) {
      const thirdParty = claim.thirdPartyInfo as Record<string, string> | null;

      reset({
        vehicleId: claim.vehicleId,
        policyId: claim.policyId || undefined,
        driverUserId: claim.driverUserId || undefined,
        accidentDate: format(new Date(claim.accidentDate), 'yyyy-MM-dd'),
        accidentTime: claim.accidentTime
          ? format(new Date(claim.accidentTime), 'HH:mm')
          : undefined,
        accidentLocation: claim.accidentLocation || undefined,
        damageCategory: claim.damageCategory as DamageCategory,
        damageSubcategory: claim.damageSubcategory || undefined,
        description: claim.description || undefined,
        policeInvolved: claim.policeInvolved,
        policeFileNumber: claim.policeFileNumber || undefined,
        hasInjuries: claim.hasInjuries,
        injuryDetails: claim.injuryDetails || undefined,
        estimatedCost: claim.estimatedCost ? Number(claim.estimatedCost) : undefined,
        thirdPartyLicensePlate: thirdParty?.licensePlate || undefined,
        thirdPartyOwnerName: thirdParty?.ownerName || undefined,
        thirdPartyPhone: thirdParty?.ownerPhone || undefined,
        thirdPartyInsurer: thirdParty?.insurerName || undefined,
      });
    }
  }, [claim, reset]);

  const policeInvolved = watch('policeInvolved');
  const hasInjuries = watch('hasInjuries');
  const selectedVehicleId = watch('vehicleId');
  const selectedDriverId = watch('driverUserId');
  const selectedPolicyId = watch('policyId');
  const selectedDamageCategory = watch('damageCategory');

  const activeVehicles = vehicles?.filter((v) => v.isActive) ?? [];
  const activeUsers = users?.filter((u) => u.isActive) ?? [];
  const activePolicies = policies?.filter((p) => p.isActive) ?? [];

  // Check if claim can be edited
  const canEdit = claim && (
    claim.status === ClaimStatus.DRAFT ||
    claim.status === ClaimStatus.REJECTED
  );

  const onSubmit = async (data: ClaimFormData) => {
    try {
      // Build third party info if provided
      const thirdPartyInfo = data.thirdPartyLicensePlate || data.thirdPartyOwnerName
        ? {
            licensePlate: data.thirdPartyLicensePlate || undefined,
            ownerName: data.thirdPartyOwnerName || undefined,
            ownerPhone: data.thirdPartyPhone || undefined,
            insurerName: data.thirdPartyInsurer || undefined,
          }
        : undefined;

      // Parse estimatedCost safely
      const estimatedCost = data.estimatedCost && !isNaN(Number(data.estimatedCost))
        ? Number(data.estimatedCost)
        : undefined;

      const updateData = {
        vehicleId: data.vehicleId,
        policyId: data.policyId || undefined,
        driverUserId: data.driverUserId || undefined,
        accidentDate: data.accidentDate,
        accidentTime: data.accidentTime || undefined,
        accidentLocation: data.accidentLocation || undefined,
        damageCategory: data.damageCategory,
        damageSubcategory: data.damageSubcategory || undefined,
        description: data.description || undefined,
        policeInvolved: Boolean(data.policeInvolved),
        policeFileNumber: data.policeFileNumber || undefined,
        hasInjuries: Boolean(data.hasInjuries),
        injuryDetails: data.injuryDetails || undefined,
        estimatedCost,
        thirdPartyInfo,
      };

      await updateClaim.mutateAsync({ id: claimId, data: updateData as never });
      router.push(`/claims/${claimId}` as Route);
    } catch (error) {
      console.error('Error updating claim:', error);
    }
  };

  const isLoading = claimLoading || vehiclesLoading || usersLoading || policiesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-600 mb-4">Schaden nicht gefunden</p>
        <Link href={'/claims' as Route}>
          <Button>Zurück zur Liste</Button>
        </Link>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-amber-600 mb-4">
          Dieser Schaden kann nicht mehr bearbeitet werden (Status: {claim.status})
        </p>
        <Link href={`/claims/${claimId}` as Route}>
          <Button>Zurück zur Detailansicht</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/claims/${claimId}` as Route}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Schaden bearbeiten
          </h1>
          <p className="text-muted-foreground">
            {claim.claimNumber}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Fahrzeug & Datum */}
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Fahrzeug & Zeitpunkt
            </CardTitle>
            <CardDescription>
              Fahrzeug und Unfallzeitpunkt bearbeiten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Fahrzeug *</Label>
                <Select
                  value={selectedVehicleId}
                  onValueChange={(value) => setValue('vehicleId', value, { shouldDirty: true })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Fahrzeug wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicleId && (
                  <p className="text-sm text-red-500">{errors.vehicleId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverUserId">Fahrer (optional)</Label>
                <Select
                  value={selectedDriverId || '_none'}
                  onValueChange={(value) => setValue('driverUserId', value === '_none' ? undefined : value, { shouldDirty: true })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Ich selbst / Kein Fahrer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Ich selbst</SelectItem>
                    {activeUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accidentDate">Unfalldatum *</Label>
                <Input
                  id="accidentDate"
                  type="date"
                  className="rounded-xl"
                  {...register('accidentDate', { required: 'Datum erforderlich' })}
                />
                {errors.accidentDate && (
                  <p className="text-sm text-red-500">{errors.accidentDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accidentTime">Unfallzeit (optional)</Label>
                <Input
                  id="accidentTime"
                  type="time"
                  className="rounded-xl"
                  {...register('accidentTime')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="policyId">Versicherungsvertrag (optional)</Label>
                <Select
                  value={selectedPolicyId || '_none'}
                  onValueChange={(value) => setValue('policyId', value === '_none' ? undefined : value, { shouldDirty: true })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Vertrag wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Kein Vertrag</SelectItem>
                    {activePolicies.map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        {policy.policyNumber} - {policy.insurer?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unfallort & Schadenart */}
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Unfallort & Schadenart
            </CardTitle>
            <CardDescription>
              Unfallort und Schadenart bearbeiten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="accidentLocation">Unfallort</Label>
                <Input
                  id="accidentLocation"
                  placeholder="z.B. Hauptstrasse 15, 10115 Berlin"
                  className="rounded-xl"
                  {...register('accidentLocation')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="damageCategory">Schadenart *</Label>
                <Select
                  value={selectedDamageCategory}
                  onValueChange={(value) => setValue('damageCategory', value as DamageCategory, { shouldDirty: true })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(damageCategoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="damageSubcategory">Unterkategorie (optional)</Label>
                <Input
                  id="damageSubcategory"
                  placeholder="z.B. Karosserie, Motor..."
                  className="rounded-xl"
                  {...register('damageSubcategory')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Geschätzte Kosten (EUR)</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="rounded-xl"
                  {...register('estimatedCost', { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Beschreibung */}
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Beschreibung
            </CardTitle>
            <CardDescription>
              Unfallhergang beschreiben
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Unfallhergang</Label>
              <Textarea
                id="description"
                placeholder="Beschreiben Sie, wie es zum Unfall kam..."
                className="min-h-[150px] rounded-xl"
                {...register('description')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Zusätzliche Informationen */}
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Zusätzliche Informationen
            </CardTitle>
            <CardDescription>
              Polizei, Personenschaden und Unfallgegner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Polizei */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="policeInvolved"
                  className="h-4 w-4 rounded border-gray-300"
                  {...register('policeInvolved')}
                />
                <Label htmlFor="policeInvolved">Polizei war involviert</Label>
              </div>
              {policeInvolved && (
                <div className="space-y-2 ml-7">
                  <Label htmlFor="policeFileNumber">Polizei-Aktenzeichen</Label>
                  <Input
                    id="policeFileNumber"
                    placeholder="z.B. 123/45/678"
                    className="rounded-xl"
                    {...register('policeFileNumber')}
                  />
                </div>
              )}
            </div>

            {/* Personenschaden */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasInjuries"
                  className="h-4 w-4 rounded border-gray-300"
                  {...register('hasInjuries')}
                />
                <Label htmlFor="hasInjuries">Es gab Personenschaden</Label>
              </div>
              {hasInjuries && (
                <div className="space-y-2 ml-7">
                  <Label htmlFor="injuryDetails">Details zum Personenschaden</Label>
                  <Textarea
                    id="injuryDetails"
                    placeholder="Beschreiben Sie die Verletzungen..."
                    className="min-h-[100px] rounded-xl"
                    {...register('injuryDetails')}
                  />
                </div>
              )}
            </div>

            {/* Unfallgegner */}
            <div className="space-y-4">
              <h4 className="font-medium">Unfallgegner (optional)</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="thirdPartyLicensePlate">Kennzeichen</Label>
                  <Input
                    id="thirdPartyLicensePlate"
                    placeholder="z.B. B-AB 1234"
                    className="rounded-xl"
                    {...register('thirdPartyLicensePlate')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thirdPartyOwnerName">Name des Halters</Label>
                  <Input
                    id="thirdPartyOwnerName"
                    placeholder="Max Mustermann"
                    className="rounded-xl"
                    {...register('thirdPartyOwnerName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thirdPartyPhone">Telefonnummer</Label>
                  <Input
                    id="thirdPartyPhone"
                    placeholder="+49 123 456789"
                    className="rounded-xl"
                    {...register('thirdPartyPhone')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thirdPartyInsurer">Versicherung</Label>
                  <Input
                    id="thirdPartyInsurer"
                    placeholder="z.B. Allianz"
                    className="rounded-xl"
                    {...register('thirdPartyInsurer')}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
          <Link href={`/claims/${claimId}` as Route}>
            <Button variant="outline" className="w-full sm:w-auto rounded-xl">
              Abbrechen
            </Button>
          </Link>
          <Button
            type="submit"
            className="w-full sm:w-auto rounded-xl"
            disabled={isSubmitting || updateClaim.isPending}
          >
            {(isSubmitting || updateClaim.isPending) ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Änderungen speichern
          </Button>
        </div>
      </form>
    </div>
  );
}
