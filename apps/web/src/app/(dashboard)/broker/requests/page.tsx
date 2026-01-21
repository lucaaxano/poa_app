'use client';

import { Building2, Check, X, Clock, Loader2, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, type BrokerRequest } from '@/lib/api/auth';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api/client';
import { OnboardingDialog } from '@/components/help';

export default function BrokerRequestsPage() {
  const queryClient = useQueryClient();

  // Fetch broker requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['broker-requests'],
    queryFn: () => authApi.getBrokerRequests(),
  });

  // Accept request mutation
  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => authApi.acceptBrokerRequest(requestId),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['broker-requests'] });
      queryClient.invalidateQueries({ queryKey: ['broker-companies'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Reject request mutation
  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => authApi.rejectBrokerRequest(requestId),
    onSuccess: () => {
      toast.success('Anfrage abgelehnt');
      queryClient.invalidateQueries({ queryKey: ['broker-requests'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getExpiresInDays = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <OnboardingDialog pageKey="broker-requests" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OnboardingDialog pageKey="broker-requests" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Broker-Anfragen</h1>
        <p className="text-muted-foreground">
          Firmen, die Sie als Broker hinzufuegen moechten
        </p>
      </div>

      {requests && requests.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => {
            const daysLeft = getExpiresInDays(request.expiresAt);
            const isProcessing = acceptMutation.isPending || rejectMutation.isPending;

            return (
              <Card key={request.id} className="rounded-2xl border shadow-soft">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      {request.company.logoUrl ? (
                        <img
                          src={request.company.logoUrl}
                          alt={request.company.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {daysLeft > 0 ? `${daysLeft} Tage` : 'Abgelaufen'}
                    </div>
                  </div>
                  <CardTitle className="mt-4">{request.company.name}</CardTitle>
                  <CardDescription>
                    Eingeladen von {request.invitedBy.firstName} {request.invitedBy.lastName}
                    <br />
                    <span className="text-xs">{request.invitedBy.email}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Angefragt am {formatDate(request.createdAt)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl"
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={isProcessing}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Ablehnen
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-xl"
                      onClick={() => acceptMutation.mutate(request.id)}
                      disabled={isProcessing}
                    >
                      {acceptMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Annehmen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-2xl border shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium">Keine offenen Anfragen</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Sobald eine Firma Sie als Broker hinzufuegen moechte, erscheint die Anfrage hier.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
