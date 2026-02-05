'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionCard } from '@/components/billing/subscription-card';
import { PricingCalculator } from '@/components/billing/pricing-calculator';
import { useSubscription, useRefreshSubscription, useStripeConfig } from '@/hooks/use-subscription';
import { toast } from 'sonner';
import { CreditCard, Car, Receipt, CheckCircle2 } from 'lucide-react';

export default function BillingSettingsPage() {
  const searchParams = useSearchParams();
  const { data: subscription, isLoading } = useSubscription();
  const { data: stripeConfig } = useStripeConfig();
  const refreshSubscription = useRefreshSubscription();

  // Handle URL parameters from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success('Abonnement erfolgreich aktiviert!', {
        description: 'Vielen Dank für Ihr Vertrauen.',
        duration: 5000,
      });
      refreshSubscription();
      // Clean up URL
      window.history.replaceState({}, '', '/settings/billing');
    } else if (canceled === 'true') {
      toast.info('Vorgang abgebrochen', {
        description: 'Der Checkout wurde abgebrochen.',
        duration: 3000,
      });
      // Clean up URL
      window.history.replaceState({}, '', '/settings/billing');
    }
  }, [searchParams, refreshSubscription]);

  const hasSubscription = subscription?.subscriptionId && subscription?.status !== 'canceled';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      {hasSubscription ? (
        <SubscriptionCard />
      ) : (
        <PricingCalculator priceId={stripeConfig?.priceId || ''} />
      )}

      {/* Pricing Info Card */}
      <Card className="rounded-2xl border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Preismodell
          </CardTitle>
          <CardDescription>
            Transparente Abrechnung nach Fahrzeuganzahl
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <Car className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Pro Fahrzeug</p>
                <p className="text-2xl font-bold">4,99 EUR<span className="text-sm font-normal text-muted-foreground"> / Monat</span></p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <CreditCard className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Mindestpreis</p>
                <p className="text-2xl font-bold">49,00 EUR<span className="text-sm font-normal text-muted-foreground"> / Monat</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card className="rounded-2xl border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Inklusive Leistungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'Unbegrenzte Schadenmeldungen',
              'Unbegrenzte Benutzer',
              'E-Mail-Versand an Versicherungen',
              'Dokumenten-Upload',
              'Dashboard & Statistiken',
              'E-Mail-Support',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="rounded-2xl border shadow-soft">
        <CardHeader>
          <CardTitle>Haeufige Fragen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">Wie wird die Fahrzeuganzahl berechnet?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Es werden nur aktive Fahrzeuge in Ihrem Fuhrpark gezaehlt. Deaktivierte Fahrzeuge werden nicht berechnet.
            </p>
          </div>
          <div>
            <p className="font-medium">Kann ich jederzeit kuendigen?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ja, das Abonnement ist monatlich kuendbar. Bei Kuendigung bleibt der Zugang bis zum Ende der bezahlten Periode aktiv.
            </p>
          </div>
          <div>
            <p className="font-medium">Was passiert bei mehr Fahrzeugen?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Der Preis passt sich automatisch an. Bei der nächsten Abrechnung wird die aktuelle Fahrzeuganzahl berücksichtigt.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
