'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserMenu } from './user-menu';
import { CompanySwitcher } from '@/components/broker/company-switcher';
import { NotificationDropdown } from '@/components/notifications';
import { useAuthStore } from '@/stores/auth-store';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMenuClick, showMenuButton = false }: HeaderProps) {
  const { user } = useAuthStore();
  const isBroker = user?.role === 'BROKER';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-lg px-4 sm:px-6">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo-icon.png"
            alt="POA Logo"
            width={40}
            height={40}
            className="shrink-0"
          />
        </Link>

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

        {/* Company Switcher for Broker - Visible on all screen sizes */}
        {isBroker && (
          <div className="w-48 sm:w-56">
            <CompanySwitcher />
          </div>
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
        {/* Notification Dropdown */}
        <NotificationDropdown />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
