'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2, Globe, Phone, MapPin, Upload, Trash2, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany, useUpdateCompany, useUploadLogo, useDeleteLogo } from '@/hooks/use-company-stats';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api/client';

const companySchema = z.object({
  name: z.string().min(1, 'Firmenname ist erforderlich').max(200),
  address: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(3).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  website: z.string().max(200).optional().or(z.literal('')),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanySettingsPage() {
  const { data: company, isLoading: isLoadingCompany } = useCompany();
  const updateCompany = useUpdateCompany();
  const uploadLogo = useUploadLogo();
  const deleteLogo = useDeleteLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  // Set logo preview from company data
  useEffect(() => {
    if (company?.logoUrl) {
      setLogoPreview(company.logoUrl);
    }
  }, [company?.logoUrl]);

  // Set form values when company data is loaded
  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        address: company.address || '',
        city: company.city || '',
        postalCode: company.postalCode || '',
        country: company.country || 'DE',
        phone: company.phone || '',
        website: company.website || '',
      });
    }
  }, [company, reset]);

  const onSubmit = async (data: CompanyFormData) => {
    try {
      await updateCompany.mutateAsync(data);
      toast.success('Firmendaten erfolgreich aktualisiert');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Fehler beim Speichern';
      toast.error(message);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Nur JPEG, PNG, WebP und SVG Dateien sind erlaubt');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Die Datei darf maximal 2MB gross sein');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      await uploadLogo.mutateAsync(file);
      toast.success('Logo erfolgreich hochgeladen');
    } catch (error) {
      toast.error(getErrorMessage(error));
      // Revert preview on error
      setLogoPreview(company?.logoUrl || null);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogoDelete = async () => {
    try {
      await deleteLogo.mutateAsync();
      setLogoPreview(null);
      toast.success('Logo erfolgreich entfernt');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoadingCompany) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Upload - Outside form */}
      <Card className="rounded-2xl border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Firmenlogo
          </CardTitle>
          <CardDescription>
            Laden Sie Ihr Firmenlogo hoch (max. 2MB, JPEG/PNG/WebP/SVG)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Logo Preview */}
            <div className="relative h-24 w-24 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Firmenlogo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              )}
              {(uploadLogo.isPending || deleteLogo.isPending) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLogo.isPending || deleteLogo.isPending}
                className="rounded-xl"
              >
                <Upload className="mr-2 h-4 w-4" />
                Logo hochladen
              </Button>
              {logoPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleLogoDelete}
                  disabled={uploadLogo.isPending || deleteLogo.isPending}
                  className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Entfernen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Firmendaten */}
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Firmendaten
            </CardTitle>
            <CardDescription>
              Grundlegende Informationen zu Ihrer Firma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Firmenname <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="z.B. Muster Transport GmbH"
                className="rounded-xl"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Adresse */}
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresse
            </CardTitle>
            <CardDescription>
              Firmensitz und Postadresse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Strasse und Hausnummer</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="z.B. Musterstrasse 123"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postleitzahl</Label>
                <Input
                  id="postalCode"
                  {...register('postalCode')}
                  placeholder="z.B. 10115"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="z.B. Berlin"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Land</Label>
                <Input
                  id="country"
                  {...register('country')}
                  placeholder="z.B. DE"
                  maxLength={3}
                  className="rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kontakt */}
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Kontakt
            </CardTitle>
            <CardDescription>
              Kontaktinformationen der Firma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="z.B. +49 30 123456789"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="website"
                    {...register('website')}
                    placeholder="z.B. https://www.beispiel.de"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={!isDirty}
            className="rounded-xl"
          >
            Zuruecksetzen
          </Button>
          <Button
            type="submit"
            className="rounded-xl"
            disabled={updateCompany.isPending || !isDirty}
          >
            {updateCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </form>
    </div>
  );
}
