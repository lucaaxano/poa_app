'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || '??';
}

// PERFORMANCE FIX: Memoized component with granular selectors
export const UserMenu = memo(function UserMenu() {
  const router = useRouter();
  // PERFORMANCE FIX: Use granular selectors to prevent unnecessary re-renders
  // Only subscribe to the specific state we need
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);
  const logout = useAuthStore((state) => state.logout);

  // PERFORMANCE FIX: Don't use await on logout - it now updates state immediately
  // and clears cache in background. This makes logout feel instant.
  const handleLogout = () => {
    logout();
    toast.success('Erfolgreich abgemeldet');
    // Navigation happens automatically via Dashboard layout useEffect
  };

  const initials = getInitials(user?.firstName, user?.lastName);
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Benutzer';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 gap-2 rounded-xl px-2 hover:bg-muted"
          aria-label={`Benutzermenu fuer ${fullName}`}
        >
          {company?.logoUrl ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-muted">
              <img
                src={company.logoUrl}
                alt={company.name || 'Firmenlogo'}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium" aria-hidden="true">
              {initials}
            </div>
          )}
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium">{user?.firstName}</span>
          </div>
          <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-xl p-2" align="end" forceMount>
        <DropdownMenuLabel className="font-normal px-2 py-1.5">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            {company && (
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {company.name}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          onClick={() => router.push('/profile' as Route)}
          className="rounded-lg cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push('/settings' as Route)}
          className="rounded-lg cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Einstellungen</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Abmelden</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
