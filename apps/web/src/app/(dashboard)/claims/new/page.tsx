'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Send,
  MessageCircle,
  Sparkles,
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
import { useCreateClaim } from '@/hooks/use-claims';
import { DamageCategory } from '@poa/shared';

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

export default function NewClaimPage() {
  const router = useRouter();
  const [submitMode, setSubmitMode] = useState<'draft' | 'submit'>('submit');

  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: policies, isLoading: policiesLoading } = usePolicies();
  const createClaim = useCreateClaim();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClaimFormData>({
    defaultValues: {
      accidentDate: format(new Date(), 'yyyy-MM-dd'),
      policeInvolved: false,
      hasInjuries: false,
      damageCategory: DamageCategory.LIABILITY,
    },
  });

  const policeInvolved = watch('policeInvolved');
  const hasInjuries = watch('hasInjuries');
  const selectedVehicleId = watch('vehicleId');

  const activeVehicles = vehicles?.filter((v) => v.isActive) ?? [];
  const activeUsers = users?.filter((u) => u.isActive) ?? [];
  const activePolicies = policies?.filter((p) => p.isActive) ?? [];

  const onSubmit = async (data: ClaimFormData) => {
    try {
      // Build third party info if provided
      const thirdPartyInfo = data.thirdPartyLicensePlate || data.thirdPartyOwnerName
        ? {
            licensePlate: data.thirdPartyLicensePlate,
            ownerName: data.thirdPartyOwnerName,
            ownerPhone: data.thirdPartyPhone,
            insurerName: data.thirdPartyInsurer,
          }
        : undefined;

      const claimData = {
        vehicleId: data.vehicleId,
        policyId: data.policyId || undefined,
        driverUserId: data.driverUserId || undefined,
        accidentDate: data.accidentDate, // Send as ISO string
        accidentTime: data.accidentTime || undefined,
        accidentLocation: data.accidentLocation || undefined,
        damageCategory: data.damageCategory,
        damageSubcategory: data.damageSubcategory || undefined,
        description: data.description || undefined,
        policeInvolved: data.policeInvolved,
        policeFileNumber: data.policeFileNumber || undefined,
        hasInjuries: data.hasInjuries,
        injuryDetails: data.injuryDetails || undefined,
        estimatedCost: data.estimatedCost ? Number(data.estimatedCost) : undefined,
        thirdPartyInfo,
        submitImmediately: submitMode === 'submit',
      };

      await createClaim.mutateAsync(claimData as never);
      router.push('/claims' as Route);
    } catch (error) {
      console.error('Error creating claim:', error);
    }
  };

  const isLoading = vehiclesLoading || usersLoading || policiesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={'/claims' as Route}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Neuen Schaden melden</h1>
          <p className="text-muted-foreground">
            Erfassen Sie alle Informationen zum Schadenfall
          </p>
        </div>
      </div>

      {/* Chat Option */}
      <Card className="rounded-2xl border shadow-soft bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Lieber per Chat?
              </p>
              <p className="text-sm text-muted-foreground">
                Unser KI-Assistent fuehrt Sie durch die Schadenmeldung
              </p>
            </div>
          </div>
          <Link href={'/claims/new/chat' as Route}>
            <Button variant="outline" className="rounded-xl border-primary/30 hover:bg-primary/10">
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat starten
            </Button>
          </Link>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Fahrzeug & Datum */}
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Fahrzeug & Zeitpunkt
            </CardTitle>
            <CardDescription>
              Waehlen Sie das betroffene Fahrzeug und geben Sie Datum und Uhrzeit des Unfalls an
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Fahrzeug *</Label>
                <Select
                  value={selectedVehicleId}
                  onValueChange={(value) => setValue('vehicleId', value)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Fahrzeug waehlen..." />
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
                  onValueChange={(value) => setValue('driverUserId', value === '_none' ? undefined : value)}
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
                  onValueChange={(value) => setValue('policyId', value === '_none' ? undefined : value)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Vertrag waehlen..." />
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
              Beschreiben Sie den Unfallort und die Art des Schadens
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
                  defaultValue={DamageCategory.LIABILITY}
                  onValueChange={(value) => setValue('damageCategory', value as DamageCategory)}
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
                <Label htmlFor="estimatedCost">Geschaetzte Kosten (EUR)</Label>
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
              Beschreiben Sie den Unfallhergang so detailliert wie moeglich
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

        {/* Zusaetzliche Informationen */}
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Zusaetzliche Informationen
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
          <Link href={'/claims' as Route}>
            <Button variant="outline" className="w-full sm:w-auto rounded-xl">
              Abbrechen
            </Button>
          </Link>
          <Button
            type="submit"
            variant="outline"
            className="w-full sm:w-auto rounded-xl"
            disabled={isSubmitting || createClaim.isPending}
            onClick={() => setSubmitMode('draft')}
          >
            {(isSubmitting || createClaim.isPending) && submitMode === 'draft' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Als Entwurf speichern
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto rounded-xl"
            disabled={isSubmitting || createClaim.isPending || !selectedVehicleId}
            onClick={() => setSubmitMode('submit')}
          >
            {(isSubmitting || createClaim.isPending) && submitMode === 'submit' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Schaden melden
          </Button>
        </div>
      </form>
    </div>
  );
}
