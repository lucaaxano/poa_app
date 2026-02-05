'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Shield, ShieldCheck, ShieldOff, KeyRound, Copy, Check, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/api/client';

type Step = 'status' | 'setup' | 'verify' | 'backup-codes';

interface SetupData {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export default function SecuritySettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [step, setStep] = useState<Step>('status');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch 2FA status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await authApi.get2FAStatus();
      setTwoFactorEnabled(response.twoFactorEnabled);
    } catch (error) {
      toast.error('Fehler beim Laden des 2FA-Status');
    } finally {
      setIsLoading(false);
    }
  };

  const startSetup = async () => {
    setIsSubmitting(true);
    try {
      const data = await authApi.get2FASetup();
      setSetupData(data);
      setStep('setup');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setVerificationCode(pastedData.split(''));
    }
  };

  const verifyAndEnable = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      toast.error('Bitte geben Sie den 6-stelligen Code ein');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.enable2FA(code);
      setTwoFactorEnabled(true);
      setStep('backup-codes');
      toast.success('Zwei-Faktor-Authentifizierung erfolgreich aktiviert');
    } catch (error) {
      toast.error(getErrorMessage(error));
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const disable2FA = async () => {
    if (!disablePassword) {
      toast.error('Bitte geben Sie Ihr Passwort ein');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.disable2FA(disablePassword);
      setTwoFactorEnabled(false);
      setShowDisableForm(false);
      setDisablePassword('');
      toast.success('Zwei-Faktor-Authentifizierung deaktiviert');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerateBackupCodes = async () => {
    setIsSubmitting(true);
    try {
      const response = await authApi.regenerateBackupCodes();
      setSetupData(prev => prev ? { ...prev, backupCodes: response.backupCodes } : null);
      toast.success('Neue Backup-Codes wurden generiert');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyBackupCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllBackupCodes = () => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
      toast.success('Alle Backup-Codes wurden kopiert');
    }
  };

  const finishSetup = () => {
    setStep('status');
    setSetupData(null);
    setVerificationCode(['', '', '', '', '', '']);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Status view
  if (step === 'status') {
    return (
      <div className="space-y-6">
        {/* 2FA Status Card */}
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Zwei-Faktor-Authentifizierung
            </CardTitle>
            <CardDescription>
              Schützen Sie Ihr Konto mit einer zusätzlichen Sicherheitsebene
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                {twoFactorEnabled ? (
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                ) : (
                  <ShieldOff className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {twoFactorEnabled ? '2FA ist aktiviert' : '2FA ist deaktiviert'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled
                      ? 'Ihr Konto ist durch 2FA geschützt'
                      : 'Aktivieren Sie 2FA für zusätzliche Sicherheit'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Die Zwei-Faktor-Authentifizierung (2FA) erfordert neben Ihrem Passwort
                einen zusätzlichen Sicherheitscode, der alle 30 Sekunden in Ihrer
                Authenticator-App generiert wird.
              </p>
              <p>
                Unterstützte Apps: Google Authenticator, Microsoft Authenticator,
                Authy, 1Password und weitere TOTP-kompatible Apps.
              </p>
            </div>

            {/* Actions */}
            {twoFactorEnabled ? (
              <div className="space-y-4">
                {!showDisableForm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDisableForm(true)}
                    className="rounded-xl"
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    2FA deaktivieren
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 rounded-xl border bg-destructive/5">
                    <p className="text-sm font-medium text-destructive">
                      Geben Sie Ihr Passwort ein, um 2FA zu deaktivieren:
                    </p>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        placeholder="Ihr Passwort"
                        className="rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDisableForm(false);
                          setDisablePassword('');
                        }}
                        className="rounded-xl"
                      >
                        Abbrechen
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={disable2FA}
                        disabled={isSubmitting || !disablePassword}
                        className="rounded-xl"
                      >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Deaktivieren
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={startSetup}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ShieldCheck className="mr-2 h-4 w-4" />
                2FA aktivieren
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Setup view - Show QR code
  if (step === 'setup' && setupData) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              2FA einrichten - Schritt 1 von 2
            </CardTitle>
            <CardDescription>
              Scannen Sie den QR-Code mit Ihrer Authenticator-App
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-xl shadow-inner">
                <img
                  src={setupData.qrCodeDataUrl}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Oder geben Sie diesen Code manuell ein:
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-muted rounded-xl font-mono text-sm break-all">
                  {setupData.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(setupData.secret);
                    toast.success('Code kopiert');
                  }}
                  className="rounded-xl shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('status');
                  setSetupData(null);
                }}
                className="rounded-xl"
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => setStep('verify')}
                className="rounded-xl"
              >
                Weiter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verify view - Enter code to confirm
  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              2FA einrichten - Schritt 2 von 2
            </CardTitle>
            <CardDescription>
              Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Code Input */}
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {verificationCode.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="h-14 w-12 rounded-xl text-center text-2xl font-bold"
                  disabled={isSubmitting}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('setup')}
                className="rounded-xl"
              >
                Zurück
              </Button>
              <Button
                onClick={verifyAndEnable}
                disabled={isSubmitting || verificationCode.some(d => !d)}
                className="rounded-xl"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aktivieren
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Backup codes view
  if (step === 'backup-codes' && setupData) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              2FA erfolgreich aktiviert
            </CardTitle>
            <CardDescription>
              Speichern Sie Ihre Backup-Codes an einem sicheren Ort
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Warning */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <p className="text-sm font-medium">Wichtig!</p>
              <p className="text-sm mt-1">
                Diese Codes können jeweils nur einmal verwendet werden, um sich anzumelden,
                wenn Sie keinen Zugang zu Ihrer Authenticator-App haben. Bewahren Sie sie sicher auf!
              </p>
            </div>

            {/* Backup Codes Grid */}
            <div className="grid grid-cols-2 gap-2">
              {setupData.backupCodes.map((code, index) => (
                <button
                  key={index}
                  onClick={() => copyBackupCode(code, index)}
                  className="flex items-center justify-between px-4 py-2 bg-muted rounded-xl font-mono text-sm hover:bg-muted/80 transition-colors"
                >
                  <span>{code}</span>
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={copyAllBackupCodes}
                className="rounded-xl"
              >
                <Copy className="mr-2 h-4 w-4" />
                Alle kopieren
              </Button>
              <Button
                variant="outline"
                onClick={regenerateBackupCodes}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Neue Codes generieren
              </Button>
            </div>

            {/* Finish */}
            <div className="flex justify-end">
              <Button onClick={finishSetup} className="rounded-xl">
                Fertig
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
