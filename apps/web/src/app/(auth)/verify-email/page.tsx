'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/api/client';
import { ArrowLeft, CheckCircle, AlertCircle, Mail, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('Ungültiger Verifizierungslink');
      return;
    }

    const verifyEmail = async () => {
      try {
        await authApi.verifyEmail(token);
        setIsVerified(true);
        toast.success('E-Mail-Adresse erfolgreich bestätigt');
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="mb-12 inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
              P
            </div>
            <span className="text-xl font-semibold">POA</span>
          </Link>

          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            E-Mail wird verifiziert...
          </h1>
          <p className="mt-3 text-muted-foreground">
            Bitte warten Sie einen Moment.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="mb-12 inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
              P
            </div>
            <span className="text-xl font-semibold">POA</span>
          </Link>

          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Verifizierung fehlgeschlagen
          </h1>
          <p className="mt-3 text-muted-foreground">
            {error}
          </p>
          <div className="mt-8 space-y-3">
            <Link href="/login" className="block">
              <Button className="h-12 w-full rounded-xl">
                Zum Login
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Sie können auf der Login-Seite einen neuen Verifizierungslink anfordern.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="mb-12 inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            P
          </div>
          <span className="text-xl font-semibold">POA</span>
        </Link>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          E-Mail bestätigt!
        </h1>
        <p className="mt-3 text-muted-foreground">
          Ihre E-Mail-Adresse wurde erfolgreich verifiziert. Sie können sich jetzt anmelden.
        </p>

        <Link href="/login" className="mt-8 block">
          <Button className="h-12 w-full rounded-xl text-base">
            Jetzt anmelden
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
