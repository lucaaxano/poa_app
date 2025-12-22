'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Lock, Mail, Briefcase, Check } from 'lucide-react';
import { getErrorMessage } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { useUpdateProfile, useChangePassword } from '@/hooks/use-profile';
import { toast } from 'sonner';

// Profile form schema
const profileSchema = z.object({
  firstName: z.string().min(2, 'Vorname muss mindestens 2 Zeichen haben').max(100),
  lastName: z.string().min(2, 'Nachname muss mindestens 2 Zeichen haben').max(100),
  phone: z.string().max(50).optional().or(z.literal('')),
  position: z.string().max(100).optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Password form schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z.string().min(8, 'Neues Passwort muss mindestens 8 Zeichen haben'),
  confirmPassword: z.string().min(1, 'Passwort-Bestaetigung ist erforderlich'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwoerter stimmen nicht ueberein',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

// Role label mapping
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPERADMIN: 'System-Administrator',
    COMPANY_ADMIN: 'Firmen-Administrator',
    BROKER: 'Versicherungsmakler',
    EMPLOYEE: 'Mitarbeiter',
  };
  return labels[role] || role;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Initialize profile form with user data
  useEffect(() => {
    if (user) {
      resetProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        position: user.position || '',
      });
    }
  }, [user, resetProfile]);

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data);
      toast.success('Profil erfolgreich aktualisiert');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Passwort erfolgreich geaendert');
      setPasswordSuccess(true);
      resetPassword();
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mein Profil</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre persoenlichen Daten und Kontoeinstellungen
        </p>
      </div>

      {/* Personal Information */}
      <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Persoenliche Daten
            </CardTitle>
            <CardDescription>
              Ihre persoenlichen Informationen und Kontaktdaten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Vorname <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  {...registerProfile('firstName')}
                  placeholder="Max"
                  className="rounded-xl"
                />
                {profileErrors.firstName && (
                  <p className="text-sm text-red-500">{profileErrors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Nachname <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  {...registerProfile('lastName')}
                  placeholder="Mustermann"
                  className="rounded-xl"
                />
                {profileErrors.lastName && (
                  <p className="text-sm text-red-500">{profileErrors.lastName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  {...registerProfile('phone')}
                  placeholder="+49 123 456789"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="position"
                    {...registerProfile('position')}
                    placeholder="z.B. Fahrer, Disponent"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => resetProfile()}
                disabled={!isProfileDirty}
                className="rounded-xl"
              >
                Zuruecksetzen
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={updateProfile.isPending || !isProfileDirty}
              >
                {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Account Information (Read-only) */}
      <Card className="rounded-2xl border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Kontoinformationen
          </CardTitle>
          <CardDescription>
            Ihre E-Mail-Adresse und Rolle im System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>E-Mail-Adresse</Label>
              <div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-3 py-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Die E-Mail-Adresse kann nicht geaendert werden
              </p>
            </div>

            <div className="space-y-2">
              <Label>Rolle</Label>
              <div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-3 py-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{getRoleLabel(user.role)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Passwort aendern
            </CardTitle>
            <CardDescription>
              Aktualisieren Sie Ihr Passwort regelmaessig fuer mehr Sicherheit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  Aktuelles Passwort <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...registerPassword('currentPassword')}
                  placeholder="Aktuelles Passwort"
                  className="rounded-xl"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  Neues Passwort <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword('newPassword')}
                  placeholder="Mindestens 8 Zeichen"
                  className="rounded-xl"
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Passwort bestaetigen <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword('confirmPassword')}
                  placeholder="Passwort wiederholen"
                  className="rounded-xl"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                className="rounded-xl"
                disabled={changePassword.isPending}
              >
                {changePassword.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : passwordSuccess ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {passwordSuccess ? 'Passwort geaendert' : 'Passwort aendern'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
