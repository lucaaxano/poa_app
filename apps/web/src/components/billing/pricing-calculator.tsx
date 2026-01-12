'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useVehicles } from '@/hooks/use-vehicles';
import { useCreateCheckout } from '@/hooks/use-subscription';
import { Car, Loader2 } from 'lucide-react';

const PRICE_PER_VEHICLE = 4.99;
const MINIMUM_PRICE = 49.0;
const MINIMUM_VEHICLES = 10;

interface PricingCalculatorProps {
  priceId: string;
}

export function PricingCalculator({ priceId }: PricingCalculatorProps) {
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const createCheckout = useCreateCheckout();

  const activeVehicles = vehicles?.filter((v) => v.isActive) || [];
  const vehicleCount = activeVehicles.length;
  const effectiveVehicles = Math.max(vehicleCount, MINIMUM_VEHICLES);
  const calculatedPrice = effectiveVehicles * PRICE_PER_VEHICLE;
  const isMinimumPrice = vehicleCount < MINIMUM_VEHICLES;

  const handleSubscribe = () => {
    createCheckout.mutate(priceId);
  };

  if (vehiclesLoading) {
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

  return (
    <Card className="rounded-2xl border shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          Ihr Preis
        </CardTitle>
        <CardDescription>
          Basierend auf Ihrer Flottengröße
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Ihre Flotte</span>
            <span className="font-medium">{vehicleCount} Fahrzeuge</span>
          </div>

          <div className="border-t pt-3">
            {isMinimumPrice ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Mindestpreis</span>
                  <span className="text-2xl font-bold">
                    {MINIMUM_PRICE.toFixed(2).replace('.', ',')} EUR
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Inklusive bis zu {MINIMUM_VEHICLES} Fahrzeuge
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{vehicleCount} x {PRICE_PER_VEHICLE.toFixed(2).replace('.', ',')} EUR</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-muted-foreground">Monatlich</span>
                  <span className="text-2xl font-bold">
                    {calculatedPrice.toFixed(2).replace('.', ',')} EUR
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleSubscribe}
            disabled={createCheckout.isPending}
            className="w-full"
            size="lg"
          >
            {createCheckout.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird geladen...
              </>
            ) : (
              'Jetzt abonnieren'
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Sie werden zu Stripe weitergeleitet
          </p>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Monatlich kuendbar</p>
          <p>• Sichere Zahlung via Stripe</p>
          <p>• Rechnung per E-Mail</p>
        </div>
      </CardContent>
    </Card>
  );
}
