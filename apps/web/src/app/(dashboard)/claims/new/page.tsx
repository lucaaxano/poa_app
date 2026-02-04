'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  Camera,
  Upload,
  X,
} from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { toast } from 'sonner';

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
import { useCreateClaim, useUploadAttachment } from '@/hooks/use-claims';
import { DamageCategory } from '@poa/shared';
import { compressImage } from '@/lib/image-utils';

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
  gpsLat?: number;
  gpsLng?: number;
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

interface StagedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

export default function NewClaimPage() {
  const router = useRouter();
  const [submitMode, setSubmitMode] = useState<'draft' | 'submit'>('submit');

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Photo state
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: policies, isLoading: policiesLoading } = usePolicies();
  const createClaim = useCreateClaim();
  const uploadAttachment = useUploadAttachment();

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
  const gpsLat = watch('gpsLat');
  const gpsLng = watch('gpsLng');

  const activeVehicles = vehicles?.filter((v) => v.isActive) ?? [];
  const activeUsers = users?.filter((u) => u.isActive) ?? [];
  const activePolicies = policies?.filter((p) => p.isActive) ?? [];

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      stagedPhotos.forEach((photo: StagedPhoto) => URL.revokeObjectURL(photo.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- GPS Handler ---
  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Standortermittlung wird von Ihrem Browser nicht unterstuetzt.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setValue('gpsLat', latitude);
        setValue('gpsLng', longitude);

        // Reverse geocoding via Nominatim
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=de`,
            { headers: { 'User-Agent': 'POA-ClaimForm/1.0' } }
          );
          if (response.ok) {
            const data = await response.json();
            if (data.display_name) {
              setValue('accidentLocation', data.display_name);
            }
          }
        } catch {
          // Reverse geocoding failed, coordinates are still set
        }

        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Standortzugriff wurde verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Der Standort konnte nicht ermittelt werden.');
            break;
          case error.TIMEOUT:
            setLocationError('Die Standortermittlung hat zu lange gedauert. Bitte versuchen Sie es erneut.');
            break;
          default:
            setLocationError('Ein unbekannter Fehler ist bei der Standortermittlung aufgetreten.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [setValue]);

  // --- Photo Handlers ---
  const handleAddFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = MAX_PHOTOS - stagedPhotos.length;

    if (remaining <= 0) {
      toast.error(`Maximal ${MAX_PHOTOS} Fotos erlaubt.`);
      return;
    }

    if (fileArray.length > remaining) {
      toast.error(`Sie koennen nur noch ${remaining} weitere Fotos hinzufuegen.`);
    }

    const filesToAdd = fileArray.slice(0, remaining);
    const newPhotos: StagedPhoto[] = [];

    for (const file of filesToAdd) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" ist kein unterstuetztes Bildformat. Erlaubt: JPEG, PNG, WEBP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" ist zu gross (max. 20 MB).`);
        continue;
      }

      const compressed = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressed);
      newPhotos.push({
        id: crypto.randomUUID(),
        file: compressed,
        previewUrl,
      });
    }

    if (newPhotos.length > 0) {
      setStagedPhotos((prev: StagedPhoto[]) => [...prev, ...newPhotos]);
    }
  }, [stagedPhotos.length]);

  const handleRemovePhoto = useCallback((id: string) => {
    setStagedPhotos((prev: StagedPhoto[]) => {
      const photo = prev.find((p: StagedPhoto) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      return prev.filter((p: StagedPhoto) => p.id !== id);
    });
  }, []);

  const handleDragOver = useCallback((e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: { preventDefault: () => void; dataTransfer: DataTransfer }) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  }, [handleAddFiles]);

  // --- Submit ---
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
        accidentDate: data.accidentDate,
        accidentTime: data.accidentTime || undefined,
        accidentLocation: data.accidentLocation || undefined,
        gpsLat: data.gpsLat,
        gpsLng: data.gpsLng,
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

      const claim = await createClaim.mutateAsync(claimData as never);

      // Upload staged photos sequentially
      if (stagedPhotos.length > 0) {
        setIsUploading(true);
        setUploadProgress({ current: 0, total: stagedPhotos.length });
        let failedCount = 0;

        for (let i = 0; i < stagedPhotos.length; i++) {
          setUploadProgress({ current: i + 1, total: stagedPhotos.length });
          try {
            await uploadAttachment.mutateAsync({
              id: (claim as { id: string }).id,
              file: stagedPhotos[i].file,
            });
          } catch {
            failedCount++;
          }
        }

        setIsUploading(false);
        setUploadProgress(null);

        if (failedCount > 0) {
          toast.warning(
            `${failedCount} von ${stagedPhotos.length} Fotos konnten nicht hochgeladen werden. Sie koennen diese spaeter nachtraeglich hinzufuegen.`
          );
        }
      }

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
      {/* Upload Progress Overlay */}
      {isUploading && uploadProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-sm rounded-2xl border shadow-lg">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-semibold">Fotos werden hochgeladen...</p>
                <p className="text-sm text-muted-foreground">
                  {uploadProgress.current} von {uploadProgress.total}
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                <div className="flex gap-2">
                  <Input
                    id="accidentLocation"
                    placeholder="z.B. Hauptstrasse 15, 10115 Berlin"
                    className="flex-1 rounded-xl"
                    {...register('accidentLocation')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-xl"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    title="Aktuellen Standort ermitteln"
                  >
                    {isLocating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {gpsLat != null && gpsLng != null && (
                  <p className="text-xs text-muted-foreground">
                    GPS: {gpsLat.toFixed(6)}, {gpsLng.toFixed(6)}
                  </p>
                )}
                {locationError && (
                  <p className="text-sm text-red-500">{locationError}</p>
                )}
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

        {/* Fotos */}
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Fotos
            </CardTitle>
            <CardDescription>
              Fotografieren oder laden Sie Bilder des Schadens hoch (max. {MAX_PHOTOS} Fotos)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            <div
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Bilder hierher ziehen oder klicken</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG oder WEBP, max. 20 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleAddFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
            </div>

            {/* Photo count */}
            {stagedPhotos.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {stagedPhotos.length} von {MAX_PHOTOS} Fotos ausgewaehlt
              </p>
            )}

            {/* Preview Grid */}
            {stagedPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {stagedPhotos.map((photo: StagedPhoto) => (
                  <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.previewUrl}
                      alt="Schadensfoto"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            disabled={isSubmitting || createClaim.isPending || isUploading}
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
            disabled={isSubmitting || createClaim.isPending || isUploading || !selectedVehicleId}
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
