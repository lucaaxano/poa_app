'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginSchema } from '@poa/shared';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/api/client';
import { Eye, EyeOff, ArrowRight, Car, Shield, BarChart3, KeyRound, ArrowLeft, Mail } from 'lucide-react';
import { isNativeApp, initializeNativeFeatures, triggerHaptic } from '@/lib/capacitor-bridge';

export default function LoginPage() {
  const router = useRouter();
  const {
    login, complete2FA, complete2FAWithBackup, cancel2FA, isLoading, twoFactor,
    biometricAvailable, biometricEnrolled, checkBiometric, loginWithBiometric,
  } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState(['', '', '', '', '', '']);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isConnectionError, setIsConnectionError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Track body height changes so the container shrinks when the iOS keyboard opens.
  // Capacitor's "resize: body" sets body.style.height to the visible area;
  // we mirror that onto the container so overflow-y-auto can scroll.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const bodyH = document.body.clientHeight;
      if (bodyH > 0) {
        el.style.height = `${bodyH}px`;
      }
    });

    ro.observe(document.body);

    // Set initial height
    const bodyH = document.body.clientHeight;
    if (bodyH > 0) {
      el.style.height = `${bodyH}px`;
    }

    return () => {
      ro.disconnect();
      el.style.height = '';
    };
  }, []);

  // Scroll focused input into view after keyboard opens and container resizes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement) {
        setTimeout(() => {
          (e.target as HTMLInputElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    el.addEventListener('focusin', handleFocusIn);
    return () => el.removeEventListener('focusin', handleFocusIn);
  }, []);

  // Initialize native features and check biometric availability
  useEffect(() => {
    if (isNativeApp()) {
      initializeNativeFeatures();
      checkBiometric();
    }
  }, [checkBiometric]);

  // Restore 2FA session from sessionStorage on page load (refresh safety)
  useEffect(() => {
    const stored = sessionStorage.getItem('poa-2fa-session');
    if (stored && !twoFactor.requires2FA) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.requires2FA && parsed.tempToken && parsed.userId) {
          // Trigger state update in auth store by setting twoFactor state
          // This will restore the 2FA UI after a page refresh
          useAuthStore.setState({ twoFactor: parsed });
        }
      } catch {
        // Invalid session data - clear it
        sessionStorage.removeItem('poa-2fa-session');
      }
    }
  }, [twoFactor.requires2FA]);

  // Focus first input when 2FA is required
  useEffect(() => {
    if (twoFactor.requires2FA && !useBackupCode) {
      inputRefs.current[0]?.focus();
    }
  }, [twoFactor.requires2FA, useBackupCode]);

  // Helper to get redirect path based on user role
  const getRedirectPath = () => {
    const user = useAuthStore.getState().user;
    return user?.role === 'SUPERADMIN' ? '/admin' : '/dashboard';
  };

  const handleBiometricLogin = async () => {
    try {
      const success = await loginWithBiometric();
      if (success) {
        await triggerHaptic('success');
        toast.success('Erfolgreich angemeldet');
        router.push(getRedirectPath());
      } else {
        toast.error('Biometrische Anmeldung fehlgeschlagen');
      }
    } catch {
      toast.error('Biometrische Anmeldung fehlgeschlagen');
    }
  };

  const onSubmit = async (data: LoginSchema) => {
    try {
      setEmailNotVerified(false);
      setLoginError(null);
      setIsConnectionError(false);

      const result = await login(data);
      if (!result.requires2FA) {
        toast.success('Erfolgreich angemeldet');
        router.push(getRedirectPath());
      }
      // If 2FA is required, the UI will switch to show the 2FA input
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      // Check if it's a connection/CORS error (server not reachable)
      if ((error as Error & { isConnectionError?: boolean }).isConnectionError) {
        setIsConnectionError(true);
        setLoginError(errorMessage);
      // Check if it's an email verification error
      } else if (errorMessage.includes('E-Mail-Adresse') && errorMessage.includes('bestätigen')) {
        setEmailNotVerified(true);
        setUnverifiedEmail(data.email);
      } else {
        setLoginError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendingVerification(true);
    try {
      await authApi.resendVerificationEmail(unverifiedEmail);
      toast.success('Verifizierungs-E-Mail wurde erneut gesendet');
      setEmailNotVerified(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setResendingVerification(false);
    }
  };

  const handle2FACodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...twoFactorCode];
    newCode[index] = value;
    setTwoFactorCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 5 && newCode.every(d => d !== '')) {
      submit2FA(newCode.join(''));
    }
  };

  const handle2FAKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !twoFactorCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handle2FAPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setTwoFactorCode(newCode);
      submit2FA(pastedData);
    }
  };

  const submit2FA = async (code: string) => {
    try {
      await complete2FA(code);
      toast.success('Erfolgreich angemeldet');
      router.push(getRedirectPath());
    } catch (error) {
      toast.error(getErrorMessage(error));
      setTwoFactorCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const submitBackupCode = async () => {
    if (!backupCode || backupCode.length !== 8) {
      toast.error('Bitte geben Sie einen gültigen 8-stelligen Backup-Code ein');
      return;
    }
    try {
      await complete2FAWithBackup(backupCode);
      toast.success('Erfolgreich angemeldet');
      router.push(getRedirectPath());
    } catch (error) {
      toast.error(getErrorMessage(error));
      setBackupCode('');
    }
  };

  const handleCancel2FA = () => {
    cancel2FA();
    setTwoFactorCode(['', '', '', '', '', '']);
    setBackupCode('');
    setUseBackupCode(false);
  };

  return (
    <div ref={containerRef} className="flex h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col overflow-y-auto px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto my-auto w-full max-w-sm">
          {/* Logo */}
          <Link href="/" prefetch={false} className="mb-12 inline-flex items-center gap-3">
            <Image
              src="/logo-full.png"
              alt="POA - Point of Accident"
              width={270}
              height={68}
            />
          </Link>

          {/* Header */}
          <div className="mb-8">
            {twoFactor.requires2FA ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={handleCancel2FA}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Zwei-Faktor-Authentifizierung
                  </h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                  {useBackupCode
                    ? 'Geben Sie einen Ihrer Backup-Codes ein'
                    : 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein'}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Willkommen zurück
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Melden Sie sich an, um auf Ihr POA-Konto zuzugreifen
                </p>
              </>
            )}
          </div>

          {/* Email Not Verified Message */}
          {emailNotVerified && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-800 dark:text-amber-200">
                    E-Mail nicht verifiziert
                  </h3>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                    Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Überprüfen Sie Ihren Posteingang.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                  >
                    {resendingVerification ? 'Wird gesendet...' : 'Verifizierungs-E-Mail erneut senden'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Connection Error Message - server not reachable */}
          {isConnectionError && loginError && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {loginError}
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Der Server wird möglicherweise gerade neu gestartet.
              </p>
            </div>
          )}

          {/* Login Error Message */}
          {loginError && !emailNotVerified && !isConnectionError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {loginError}
              </p>
            </div>
          )}

          {/* 2FA Input */}
          {twoFactor.requires2FA ? (
            <div className="space-y-6">
              {useBackupCode ? (
                // Backup Code Input
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="backup-code" className="text-sm font-medium">
                      Backup-Code
                    </Label>
                    <Input
                      id="backup-code"
                      type="text"
                      placeholder="XXXXXXXX"
                      className="h-12 rounded-xl text-center font-mono text-lg tracking-widest uppercase"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase().slice(0, 8))}
                      maxLength={8}
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    onClick={submitBackupCode}
                    className="h-12 w-full rounded-xl text-base"
                    disabled={isLoading || backupCode.length !== 8}
                  >
                    {isLoading ? 'Wird überprüft...' : 'Backup-Code verwenden'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(false)}
                    className="w-full text-sm text-primary hover:underline"
                  >
                    Authenticator-App verwenden
                  </button>
                </div>
              ) : (
                // TOTP Code Input
                <div className="space-y-4">
                  <div className="flex justify-center gap-2" onPaste={handle2FAPaste}>
                    {twoFactorCode.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handle2FACodeChange(index, e.target.value)}
                        onKeyDown={(e) => handle2FAKeyDown(index, e)}
                        className="h-14 w-12 rounded-xl text-center text-2xl font-bold"
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                  <Button
                    onClick={() => submit2FA(twoFactorCode.join(''))}
                    className="h-12 w-full rounded-xl text-base"
                    disabled={isLoading || twoFactorCode.some(d => !d)}
                  >
                    {isLoading ? 'Wird überprüft...' : 'Bestätigen'}
                    {!isLoading && <KeyRound className="ml-2 h-5 w-5" />}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(true)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Backup-Code verwenden
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Normal Login Form
            <>
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
                      prefetch={false}
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

              {/* Biometric Login Button (iOS native app only) */}
              {biometricAvailable && biometricEnrolled && (
                <div className="mt-6">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">oder</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-xl text-base"
                    onClick={handleBiometricLogin}
                    disabled={isLoading}
                  >
                    <KeyRound className="mr-2 h-5 w-5" />
                    Mit Face ID / Touch ID anmelden
                  </Button>
                </div>
              )}

              {/* Footer */}
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Noch kein Konto?{' '}
                <Link href="/register" prefetch={false} className="font-medium text-primary hover:underline">
                  Jetzt registrieren
                </Link>
              </p>
              {/* Build version - hidden in production, visible for debugging */}
              <p className="mt-4 text-center text-[10px] text-muted-foreground/50">
                v2025.01.14-fix3
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-primary lg:px-12 xl:px-20">
        <div className="mx-auto max-w-md text-white">
          <h2 className="text-3xl font-bold xl:text-4xl">
            Schadenmanagement einfach gemacht
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Verwalten Sie alle KFZ-Schäden Ihrer Flotte an einem Ort. Schnell, effizient und übersichtlich.
          </p>

          <div className="mt-12 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Flottenmanagement</h3>
                <p className="mt-1 text-sm text-white/70">
                  Alle Fahrzeuge und Schäden im Überblick
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
