'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BillingStatusBadge } from './billing-status-badge';
import { useSubscription, useCreatePortal } from '@/hooks/use-subscription';
import { useVehicles } from '@/hooks/use-vehicles';
import { CreditCard, Calendar, Car, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const PRICE_PER_VEHICLE = 4.99;
const MINIMUM_VEHICLES = 10;

export function SubscriptionCard() {
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: vehicles } = useVehicles();
  const createPortal = useCreatePortal();

  const activeVehicles = vehicles?.filter((v) => v.isActive) || [];
  const vehicleCount = activeVehicles.length;
  const effectiveVehicles = Math.max(vehicleCount, MINIMUM_VEHICLES);
  const calculatedPrice = effectiveVehicles * PRICE_PER_VEHICLE;

  const handleManageSubscription = () => {
    createPortal.mutate();
  };

  if (subscriptionLoading) {
    return (
      <Card className="rounded-2xl border shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription?.subscriptionId) {
    return null;
  }

  const currentPeriodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;

  return (
    <Card className="rounded-2xl border shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Ihr Abonnement
          </CardTitle>
          <BillingStatusBadge status={subscription.status} />
        </div>
        <CardDescription>
          {subscription.productName || 'POA Flottenmanagement'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Car className="h-4 w-4" />
              <span className="text-sm">Aktive Fahrzeuge</span>
            </div>
            <p className="text-2xl font-bold">{vehicleCount}</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">Monatlicher Preis</span>
            </div>
            <p className="text-2xl font-bold">
              {calculatedPrice.toFixed(2).replace('.', ',')} EUR
            </p>
          </div>
        </div>

        {currentPeriodEnd && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {subscription.cancelAtPeriodEnd ? (
              <span className="text-yellow-600">
                Aktiv bis {format(currentPeriodEnd, 'dd. MMMM yyyy', { locale: de })}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Naechste Abrechnung: {format(currentPeriodEnd, 'dd. MMMM yyyy', { locale: de })}
              </span>
            )}
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              Ihr Abonnement wurde gekuendigt und endet am{' '}
              {currentPeriodEnd
                ? format(currentPeriodEnd, 'dd. MMMM yyyy', { locale: de })
                : 'Ende der Laufzeit'}
              . Sie koennen es jederzeit reaktivieren.
            </p>
          </div>
        )}

        <Button
          onClick={handleManageSubscription}
          disabled={createPortal.isPending}
          variant="outline"
          className="w-full"
        >
          {createPortal.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird geladen...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Abo verwalten
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Zahlungsmethode aendern, Rechnungen einsehen oder kuendigen
        </p>
      </CardContent>
    </Card>
  );
}
