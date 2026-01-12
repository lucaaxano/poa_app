'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerSchema } from '@poa/shared';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/api/client';
import { Eye, EyeOff, ArrowRight, CheckCircle2, Building2, Users, Zap, Mail } from 'lucide-react';

const registerFormSchema = registerSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwoerter stimmen nicht ueberein',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      companyName: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await authApi.register(registerData);
      setRegisteredEmail(data.email);
      setRegistrationComplete(true);
      toast.success('Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message after registration
  if (registrationComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="mb-12 inline-flex items-center justify-center">
            <Image
              src="/logo-full.png"
              alt="POA - Point of Accident"
              width={270}
              height={68}
            />
          </Link>

          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            E-Mail bestätigen
          </h1>
          <p className="mt-3 text-muted-foreground">
            Wir haben eine E-Mail an <strong>{registeredEmail}</strong> gesendet.
            Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
          </p>

          <div className="mt-8 space-y-3">
            <Link href="/login" className="block">
              <Button className="h-12 w-full rounded-xl">
                Zum Login
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Keine E-Mail erhalten? Überprüfen Sie Ihren Spam-Ordner oder fordern Sie auf der Login-Seite einen neuen Link an.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="mb-12 inline-flex items-center gap-3">
            <Image
              src="/logo-full.png"
              alt="POA - Point of Accident"
              width={270}
              height={68}
            />
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Konto erstellen
            </h1>
            <p className="mt-2 text-muted-foreground">
              Registrieren Sie Ihre Firma fuer POA
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium">
                Firmenname
              </Label>
              <Input
                id="companyName"
                placeholder="Muster GmbH"
                className="h-12 rounded-xl"
                {...register('companyName')}
                disabled={isLoading}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  Vorname
                </Label>
                <Input
                  id="firstName"
                  placeholder="Max"
                  className="h-12 rounded-xl"
                  {...register('firstName')}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Nachname
                </Label>
                <Input
                  id="lastName"
                  placeholder="Mustermann"
                  className="h-12 rounded-xl"
                  {...register('lastName')}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="max@musterfirma.de"
                className="h-12 rounded-xl"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Passwort
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 Zeichen"
                  className="h-12 rounded-xl pr-12"
                  {...register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Passwort bestaetigen
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Passwort wiederholen"
                className="h-12 rounded-xl"
                {...register('confirmPassword')}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Wird erstellt...' : 'Konto erstellen'}
              {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Bereits registriert?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-primary lg:px-12 xl:px-20">
        <div className="mx-auto max-w-md text-white">
          <h2 className="text-3xl font-bold xl:text-4xl">
            Starten Sie noch heute
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Registrieren Sie Ihre Firma und beginnen Sie sofort mit der digitalen Schadenverwaltung.
          </p>

          <div className="mt-12 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Firmenprofil</h3>
                <p className="mt-1 text-sm text-white/70">
                  Erstellen Sie Ihr Firmenprofil in wenigen Minuten
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Team einladen</h3>
                <p className="mt-1 text-sm text-white/70">
                  Laden Sie Ihre Mitarbeiter ein
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Sofort loslegen</h3>
                <p className="mt-1 text-sm text-white/70">
                  Melden Sie Ihren ersten Schaden
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Kostenloser Test
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Keine Kreditkarte
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
