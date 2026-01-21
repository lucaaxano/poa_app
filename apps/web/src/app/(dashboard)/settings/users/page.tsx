'use client';

import { useState } from 'react';
import { Search, Users, Mail, MoreHorizontal, Shield, UserX, UserCheck, Clock, Loader2, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  useUsers,
  useInvitations,
  useDeactivateUser,
  useReactivateUser,
  useDeleteUser,
  useUpdateUserRole,
  useCancelInvitation,
} from '@/hooks/use-users';
import { InviteModal } from '@/components/users/invite-modal';
import { useAuthStore } from '@/stores/auth-store';
import { UserRole } from '@poa/shared';
import { toast } from 'sonner';
import { OnboardingDialog } from '@/components/help';

const roleLabels: Record<UserRole, string> = {
  [UserRole.EMPLOYEE]: 'Mitarbeiter',
  [UserRole.COMPANY_ADMIN]: 'Administrator',
  [UserRole.BROKER]: 'Makler',
  [UserRole.SUPERADMIN]: 'Superadmin',
};

const roleColors: Record<UserRole, string> = {
  [UserRole.EMPLOYEE]: 'bg-blue-100 text-blue-700',
  [UserRole.COMPANY_ADMIN]: 'bg-purple-100 text-purple-700',
  [UserRole.BROKER]: 'bg-orange-100 text-orange-700',
  [UserRole.SUPERADMIN]: 'bg-red-100 text-red-700',
};

export default function UsersSettingsPage() {
  const [search, setSearch] = useState('');
  const [hideInactive, setHideInactive] = useState(false);
  const { user: currentUser } = useAuthStore();

  const { data: users, isLoading: isLoadingUsers } = useUsers();
  const { data: invitations, isLoading: isLoadingInvitations } = useInvitations();

  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const deleteUser = useDeleteUser();
  const updateUserRole = useUpdateUserRole();
  const cancelInvitation = useCancelInvitation();
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Filter users
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      !search ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase());

    const matchesActive = !hideInactive || user.isActive;

    return matchesSearch && matchesActive;
  });

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateUser.mutateAsync(id);
        toast.success('Benutzer deaktiviert');
      } else {
        await reactivateUser.mutateAsync(id);
        toast.success('Benutzer aktiviert');
      }
    } catch {
      toast.error('Fehler beim Aendern des Status');
    }
  };

  const handleChangeRole = async (id: string, role: UserRole) => {
    try {
      await updateUserRole.mutateAsync({ id, role });
      toast.success('Rolle erfolgreich geaendert');
    } catch {
      toast.error('Fehler beim Aendern der Rolle');
    }
  };

  const handleCancelInvitation = async (id: string) => {
    try {
      await cancelInvitation.mutateAsync(id);
      toast.success('Einladung zurueckgezogen');
    } catch {
      toast.error('Fehler beim Zurueckziehen der Einladung');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser.mutateAsync(id);
      toast.success('Benutzer erfolgreich geloescht');
      setUserToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Fehler beim Loeschen des Benutzers';
      toast.error(message);
      setUserToDelete(null);
    }
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
      <OnboardingDialog pageKey="users" />
      <Tabs defaultValue="users" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="rounded-xl">
            <TabsTrigger value="users" className="rounded-lg">
              <Users className="mr-2 h-4 w-4" />
              Benutzer ({filteredUsers?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="rounded-lg">
              <Mail className="mr-2 h-4 w-4" />
              Einladungen ({invitations?.length ?? 0})
            </TabsTrigger>
          </TabsList>
          <InviteModal />
        </div>

        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card className="rounded-2xl border shadow-soft">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Suchen nach Name oder E-Mail..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
                <Button
                  variant={hideInactive ? 'default' : 'outline'}
                  onClick={() => setHideInactive(!hideInactive)}
                  className="rounded-xl"
                >
                  {hideInactive ? 'Alle anzeigen' : 'Inaktive ausblenden'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle>Benutzerliste</CardTitle>
              <CardDescription>
                Alle Benutzer Ihrer Organisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <TableSkeleton columns={5} rows={5} />
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Rolle</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Letzter Login</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                            {user.id === currentUser?.id && (
                              <span className="ml-2 text-xs text-muted-foreground">(Sie)</span>
                            )}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role]}`}>
                              {roleLabels[user.role]}
                            </span>
                          </TableCell>
                          <TableCell>{user.position || '-'}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                user.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {user.isActive ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {user.lastLoginAt
                              ? formatDate(user.lastLoginAt)
                              : 'Nie'}
                          </TableCell>
                          <TableCell>
                            {user.id !== currentUser?.id && user.role !== 'SUPERADMIN' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Benutzeraktionen">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      handleChangeRole(
                                        user.id,
                                        user.role === 'COMPANY_ADMIN' ? UserRole.EMPLOYEE : UserRole.COMPANY_ADMIN
                                      );
                                    }}
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    {user.role === 'COMPANY_ADMIN'
                                      ? 'Zum Mitarbeiter machen'
                                      : 'Zum Admin machen'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      handleToggleStatus(user.id, user.isActive);
                                    }}
                                  >
                                    {user.isActive ? (
                                      <>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Deaktivieren
                                      </>
                                    ) : (
                                      <>
                                        <ArchiveRestore className="mr-2 h-4 w-4" />
                                        Aktivieren
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      handleDeleteUser(user.id);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Loeschen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">Keine Benutzer gefunden</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                    {search
                      ? 'Keine Benutzer entsprechen Ihrer Suche.'
                      : 'Laden Sie Mitarbeiter ein, um zu beginnen.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card className="rounded-2xl border shadow-soft">
            <CardHeader>
              <CardTitle>Offene Einladungen</CardTitle>
              <CardDescription>
                Noch nicht angenommene Einladungen
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
                        <TableHead>Rolle</TableHead>
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
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[invitation.role]}`}>
                              {roleLabels[invitation.role]}
                            </span>
                          </TableCell>
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
                              onClick={() => handleCancelInvitation(invitation.id)}
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
                    Alle Einladungen wurden bereits angenommen oder sind abgelaufen.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
