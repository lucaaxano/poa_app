'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordSchema } from '@poa/shared';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/api/client';
import { ArrowLeft, ArrowRight, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
      toast.success('Falls ein Konto existiert, wurde eine E-Mail gesendet');
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

        {isSuccess ? (
          /* Success State */
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              E-Mail gesendet
            </h1>
            <p className="mt-3 text-muted-foreground">
              Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zuruecksetzen des Passworts gesendet.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Bitte pruefen Sie Ihren Posteingang und Spam-Ordner.
            </p>
            <Link href="/login" prefetch={false} className="mt-8 block">
              <Button variant="outline" className="h-12 w-full rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurueck zum Login
              </Button>
            </Link>
          </div>
        ) : (
          /* Form State */
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Passwort vergessen?
              </h1>
              <p className="mt-3 text-muted-foreground">
                Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zuruecksetzen zu erhalten.
              </p>
            </div>

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

              <Button
                type="submit"
                className="h-12 w-full rounded-xl text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Wird gesendet...' : 'Link senden'}
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
          </>
        )}
      </div>
    </div>
  );
}
