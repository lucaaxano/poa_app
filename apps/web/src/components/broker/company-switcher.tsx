'use client';

import { memo } from 'react';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import { useBrokerCompanies } from '@/hooks/use-broker';
import { cn } from '@/lib/utils';

interface CompanySwitcherProps {
  collapsed?: boolean;
}

// PERFORMANCE FIX: Memoized component with granular selectors
export const CompanySwitcher = memo(function CompanySwitcher({ collapsed = false }: CompanySwitcherProps) {
  // PERFORMANCE FIX: Use granular selectors to prevent unnecessary re-renders
  const userRole = useAuthStore((state) => state.user?.role);
  const activeCompany = useAuthStore((state) => state.activeCompany);
  const setActiveCompany = useAuthStore((state) => state.setActiveCompany);
  const { data: companies, isLoading } = useBrokerCompanies();

  // Only show for BROKER role
  if (userRole !== 'BROKER') {
    return null;
  }

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className={cn(
          'justify-between rounded-xl',
          collapsed ? 'w-10 px-0' : 'w-full'
        )}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-between rounded-xl border-dashed',
            collapsed ? 'w-10 px-0' : 'w-full'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            {!collapsed && (
              <span className="truncate text-sm">
                {activeCompany?.name || 'Alle Firmen'}
              </span>
            )}
          </div>
          {!collapsed && (
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px]" align="start" sideOffset={8}>
        <DropdownMenuItem
          onClick={() => setActiveCompany(null)}
          className={cn(
            'flex items-center justify-between cursor-pointer',
            !activeCompany && 'bg-accent'
          )}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">Alle Firmen</span>
              <span className="text-xs text-muted-foreground">
                Aggregierte Ansicht
              </span>
            </div>
          </div>
          {!activeCompany && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        {companies && companies.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {companies.map((company) => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => setActiveCompany(company)}
                className={cn(
                  'flex items-center justify-between cursor-pointer',
                  activeCompany?.id === company.id && 'bg-accent'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{company.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {company.city || 'Keine Stadt'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {company.pendingClaims > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                      {company.pendingClaims}
                    </Badge>
                  )}
                  {activeCompany?.id === company.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {companies && companies.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Keine Firmen verknuepft
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
