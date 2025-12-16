'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginSchema } from '@poa/shared';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage } from '@/lib/api/client';
import { Eye, EyeOff, ArrowRight, Car, Shield, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    try {
      await login(data);
      toast.success('Erfolgreich angemeldet');
      router.push('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="mb-12 inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
              P
            </div>
            <span className="text-xl font-semibold">POA</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Willkommen zurueck
            </h1>
            <p className="mt-2 text-muted-foreground">
              Melden Sie sich an, um auf Ihr POA-Konto zuzugreifen
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@firma.de"
                className="h-12 rounded-xl"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Passwort
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Passwort vergessen?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ihr Passwort"
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

            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
              {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Noch kein Konto?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-primary lg:px-12 xl:px-20">
        <div className="mx-auto max-w-md text-white">
          <h2 className="text-3xl font-bold xl:text-4xl">
            Schadenmanagement einfach gemacht
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Verwalten Sie alle KFZ-Schaeden Ihrer Flotte an einem Ort. Schnell, effizient und uebersichtlich.
          </p>

          <div className="mt-12 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Flottenmanagement</h3>
                <p className="mt-1 text-sm text-white/70">
                  Alle Fahrzeuge und Schaeden im Ueberblick
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Versicherungskommunikation</h3>
                <p className="mt-1 text-sm text-white/70">
                  Automatische Weiterleitung an Ihre Versicherung
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Auswertungen</h3>
                <p className="mt-1 text-sm text-white/70">
                  Detaillierte Statistiken und Reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
