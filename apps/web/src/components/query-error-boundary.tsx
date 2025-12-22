'use client';

import { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface QueryErrorBoundaryProps {
  error: Error | null;
  isError: boolean;
  refetch?: () => void;
  children: ReactNode;
  compact?: boolean;
}

export function QueryErrorBoundary({
  error,
  isError,
  refetch,
  children,
  compact = false,
}: QueryErrorBoundaryProps) {
  if (!isError) {
    return <>{children}</>;
  }

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-destructive mb-2">Fehler beim Laden</p>
        <p className="text-xs text-muted-foreground mb-4">
          {error?.message || 'Ein unbekannter Fehler ist aufgetreten.'}
        </p>
        {refetch && (
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-3 w-3" />
            Erneut versuchen
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border-destructive/20 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg">Fehler beim Laden der Daten</CardTitle>
            <CardDescription>
              Die Daten konnten nicht geladen werden.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error?.message || 'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'}
          </p>
          {refetch && (
            <Button onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Erneut versuchen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RetryButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export function RetryButton({ onClick, isLoading }: RetryButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isLoading}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      Erneut versuchen
    </Button>
  );
}
