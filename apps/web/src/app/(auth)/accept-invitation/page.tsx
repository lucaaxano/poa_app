'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { getErrorMessage, setTokens } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { Eye, EyeOff, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';

const acceptInvitationSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'Vorname muss mindestens 2 Zeichen haben')
      .max(100, 'Vorname darf maximal 100 Zeichen haben'),
    lastName: z
      .string()
      .min(2, 'Nachname muss mindestens 2 Zeichen haben')
      .max(100, 'Nachname darf maximal 100 Zeichen haben'),
    password: z
      .string()
      .min(8, 'Passwort muss mindestens 8 Zeichen haben')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Passwort muss mindestens einen Grossbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwoerter stimmen nicht ueberein',
    path: ['confirmPassword'],
  });

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="mb-12 flex justify-center">
            <Image
              src="/logo-full.png"
              alt="POA - Point of Accident"
              width={270}
              height={68}
            />
          </Link>

          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ungueltiger Link
          </h1>
          <p className="mt-3 text-muted-foreground">
            Der Einladungslink ist ungueltig oder abgelaufen. Bitte kontaktieren Sie Ihren Administrator fuer eine neue Einladung.
          </p>
          <Link href="/login" className="mt-8 block">
            <Button variant="outline" className="h-12 w-full rounded-xl">
              Zum Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: AcceptInvitationFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.acceptInvitation({
        token,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });

      setUser(response.user, response.company);
      toast.success('Konto erfolgreich erstellt');
      router.push('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="mb-12 flex justify-center">
          <Image
            src="/logo-full.png"
            alt="POA - Point of Accident"
            width={270}
            height={68}
          />
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Einladung annehmen
          </h1>
          <p className="mt-3 text-muted-foreground">
            Vervollstaendigen Sie Ihr Profil, um Ihr Konto zu aktivieren.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            {isLoading ? 'Wird erstellt...' : 'Konto aktivieren'}
            {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <AcceptInvitationForm />
    </Suspense>
  );
}
