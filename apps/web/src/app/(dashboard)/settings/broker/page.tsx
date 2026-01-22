'use client';

import { useState } from 'react';
import { Search, Users, Mail, Trash2, Clock, Loader2, UserPlus, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, type CompanyBroker, type Invitation } from '@/lib/api/auth';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api/client';
import { OnboardingDialog } from '@/components/help';

export default function BrokerSettingsPage() {
  const [search, setSearch] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [brokerToRemove, setBrokerToRemove] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch company brokers
  const { data: brokers, isLoading: isLoadingBrokers } = useQuery({
    queryKey: ['company-brokers'],
    queryFn: () => authApi.getCompanyBrokers(),
  });

  // Fetch pending broker invitations
  const { data: invitations, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => authApi.getInvitations(),
    select: (data) => data.filter((inv) => inv.role === 'BROKER'),
  });

  // Invite broker mutation
  const inviteBrokerMutation = useMutation({
    mutationFn: (email: string) => authApi.inviteUser(email, 'BROKER'),
    onSuccess: () => {
      toast.success('Broker-Einladung gesendet');
      setInviteEmail('');
      setInviteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Remove broker mutation
  const removeBrokerMutation = useMutation({
    mutationFn: (brokerId: string) => authApi.removeBroker(brokerId),
    onSuccess: () => {
      toast.success('Broker entfernt');
      setBrokerToRemove(null);
      queryClient.invalidateQueries({ queryKey: ['company-brokers'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => authApi.cancelInvitation(invitationId),
    onSuccess: () => {
      toast.success('Einladung zurueckgezogen');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Filter brokers
  const filteredBrokers = brokers?.filter((broker) => {
    const matchesSearch =
      !search ||
      broker.email.toLowerCase().includes(search.toLowerCase()) ||
      broker.firstName.toLowerCase().includes(search.toLowerCase()) ||
      broker.lastName.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleInviteBroker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteBrokerMutation.mutate(inviteEmail.trim());
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <OnboardingDialog pageKey="broker-settings" />
      <Tabs defaultValue="brokers" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="rounded-xl">
            <TabsTrigger value="brokers" className="rounded-lg">
              <Users className="mr-2 h-4 w-4" />
              Broker ({filteredBrokers?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="rounded-lg">
              <Mail className="mr-2 h-4 w-4" />
              Einladungen ({invitations?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <UserPlus className="mr-2 h-4 w-4" />
                Broker einladen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Broker einladen</DialogTitle>
                <DialogDescription>
                  Geben Sie die E-Mail-Adresse des Brokers ein. Falls der Broker bereits registriert ist, erhaelt er eine Anfrage. Andernfalls wird eine Einladung zur Registrierung gesendet.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteBroker}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="broker-email">E-Mail-Adresse</Label>
                    <Input
                      id="broker-email"
                      type="email"
                      placeholder="broker@beispiel.de"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                    className="rounded-xl"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl"
                    disabled={inviteBrokerMutation.isPending}
                  >
                    {inviteBrokerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      'Einladen'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="brokers" className="space-y-4">
          {/* Search Filter */}
          <Card className="rounded-2xl border shadow-soft">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Suchen nach Name oder E-Mail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Brokers Table */}
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle>Verbundene Broker</CardTitle>
              <CardDescription>
                Broker, die Zugriff auf Ihre Firma haben
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBrokers ? (
                <TableSkeleton columns={4} rows={3} />
              ) : filteredBrokers && filteredBrokers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verbunden seit</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBrokers.map((broker) => (
                        <TableRow key={broker.id}>
                          <TableCell className="font-medium">
                            {broker.firstName} {broker.lastName}
                          </TableCell>
                          <TableCell>{broker.email}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                broker.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {broker.isActive ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(broker.linkedAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setBrokerToRemove(broker.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">Keine Broker verbunden</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                    Laden Sie einen Broker ein, um mit der Zusammenarbeit zu beginnen.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle>Offene Broker-Einladungen</CardTitle>
              <CardDescription>
                Ausstehende Einladungen und Anfragen an Broker
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInvitations ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : invitations && invitations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Eingeladen von</TableHead>
                        <TableHead>Laeuft ab am</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">{invitation.email}</TableCell>
                          <TableCell>
                            {invitation.invitedBy
                              ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatDate(invitation.expiresAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                              disabled={cancelInvitationMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Mail className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">Keine offenen Einladungen</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                    Alle Broker-Einladungen wurden bereits beantwortet oder sind abgelaufen.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Remove Broker Confirmation Dialog */}
      <AlertDialog open={!!brokerToRemove} onOpenChange={() => setBrokerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Broker entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Broker wird keinen Zugriff mehr auf Ihre Firmendaten haben. Diese Aktion kann nicht rueckgaengig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 hover:bg-red-700"
              onClick={() => brokerToRemove && removeBrokerMutation.mutate(brokerToRemove)}
              disabled={removeBrokerMutation.isPending}
            >
              {removeBrokerMutation.isPending ? 'Wird entfernt...' : 'Entfernen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
