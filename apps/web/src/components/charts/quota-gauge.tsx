'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuotaStats } from '@/hooks/use-company-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuotaGaugeProps {
  year?: number;
  title?: string;
  className?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function QuotaGauge({
  year,
  title = 'Schadenquote',
  className,
}: QuotaGaugeProps) {
  const { data, isLoading, error } = useQuotaStats(year);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            Fehler beim Laden der Daten
          </div>
        </CardContent>
      </Card>
    );
  }

  const { quotaRatio, quotaThreshold, isOverThreshold, totalPremium, totalClaimCost } = data;

  // Determine status color
  let statusColor = 'text-green-500';
  let bgColor = 'bg-green-500';
  let StatusIcon = CheckCircle;

  if (quotaThreshold) {
    const warningThreshold = quotaThreshold * 0.8;
    if (isOverThreshold) {
      statusColor = 'text-red-500';
      bgColor = 'bg-red-500';
      StatusIcon = AlertTriangle;
    } else if (quotaRatio >= warningThreshold) {
      statusColor = 'text-yellow-500';
      bgColor = 'bg-yellow-500';
      StatusIcon = TrendingUp;
    }
  }

  // Calculate progress percentage (capped at 100% for display)
  const progressPercent = quotaThreshold
    ? Math.min((quotaRatio / quotaThreshold) * 100, 100)
    : Math.min(quotaRatio, 100);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <StatusIcon className={cn('h-5 w-5', statusColor)} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Quota Display */}
          <div className="text-center">
            <div className={cn('text-4xl font-bold', statusColor)}>
              {formatPercent(quotaRatio)}
            </div>
            {quotaThreshold && (
              <div className="text-sm text-muted-foreground">
                von {formatPercent(quotaThreshold)} Schwellenwert
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', bgColor)}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {quotaThreshold && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{formatPercent(quotaThreshold)}</span>
              </div>
            )}
          </div>

          {/* Cost Summary */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <div className="text-xs text-muted-foreground">Schadenkosten</div>
              <div className="font-semibold">{formatCurrency(totalClaimCost)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Jahresbeitrag</div>
              <div className="font-semibold">{formatCurrency(totalPremium)}</div>
            </div>
          </div>

          {/* Status Message */}
          {quotaThreshold && (
            <div
              className={cn(
                'text-center text-sm p-2 rounded-md',
                isOverThreshold
                  ? 'bg-red-500/10 text-red-600'
                  : quotaRatio >= quotaThreshold * 0.8
                    ? 'bg-yellow-500/10 text-yellow-600'
                    : 'bg-green-500/10 text-green-600'
              )}
            >
              {isOverThreshold
                ? 'Schwellenwert überschritten!'
                : quotaRatio >= quotaThreshold * 0.8
                  ? 'Schwellenwert fast erreicht'
                  : 'Quote im grünen Bereich'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
