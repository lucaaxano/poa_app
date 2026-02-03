'use client';

import Link from 'next/link';
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
import { getErrorMessage } from '@/lib/api/client';
import { Eye, EyeOff, ArrowLeft, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';

const resetPasswordFormSchema = z
  .object({
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

type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <Link href="/" prefetch={false} className="mb-12 inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
              P
            </div>
            <span className="text-xl font-semibold">POA</span>
          </Link>

          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ungueltiger Link
          </h1>
          <p className="mt-3 text-muted-foreground">
            Der Link zum Zuruecksetzen des Passworts ist ungueltig oder abgelaufen.
          </p>
          <Link href="/forgot-password" prefetch={false} className="mt-8 block">
            <Button variant="outline" className="h-12 w-full rounded-xl">
              Neuen Link anfordern
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await authApi.resetPassword({
        token,
        password: data.password,
      });
      toast.success('Passwort erfolgreich zurueckgesetzt');
      router.push('/login');
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
        <Link href="/" prefetch={false} className="mb-12 inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            P
          </div>
          <span className="text-xl font-semibold">POA</span>
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Neues Passwort festlegen
          </h1>
          <p className="mt-3 text-muted-foreground">
            Geben Sie Ihr neues Passwort ein.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Neues Passwort
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
            {isLoading ? 'Wird gespeichert...' : 'Passwort speichern'}
            {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            prefetch={false}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurueck zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
