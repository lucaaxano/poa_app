'use client';

import { Bell, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserMenu } from './user-menu';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMenuClick, showMenuButton = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-lg px-4 sm:px-6">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden rounded-xl"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu oeffnen</span>
          </Button>
        )}

        {/* Search - Hidden on mobile */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            className="w-64 pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:bg-white focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl h-10 w-10"
        >
          <Bell className="h-5 w-5" />
          <span className="sr-only">Benachrichtigungen</span>
        </Button>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
