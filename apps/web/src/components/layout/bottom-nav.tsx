'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileWarning, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// PERFORMANCE FIX: Define icons as constants outside the component
// This prevents React from creating new icon instances on every render
const NAV_ICONS = {
  dashboard: <LayoutDashboard className="h-5 w-5" />,
  claims: <FileWarning className="h-5 w-5" />,
  chat: <MessageCircle className="h-5 w-5" />,
  profile: <User className="h-5 w-5" />,
} as const;

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' as Route, icon: NAV_ICONS.dashboard },
  { label: 'Schäden', href: '/claims' as Route, icon: NAV_ICONS.claims },
  { label: 'Chat', href: '/claims/new/chat' as Route, icon: NAV_ICONS.chat },
  { label: 'Profil', href: '/settings' as Route, icon: NAV_ICONS.profile },
] as const;

export const BottomNav = memo(function BottomNav() {
  const pathname = usePathname();

  // Route matching: most specific match wins
  // Chat is checked BEFORE Claims since /claims/new/chat is more specific than /claims
  const activeIndex = useMemo(() => {
    if (pathname.startsWith('/claims/new/chat')) return 2; // Chat
    if (pathname.startsWith('/settings')) return 3; // Profil
    if (pathname.startsWith('/claims')) return 1; // Schäden
    return 0; // Dashboard (default)
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex h-16 items-center justify-around">
        {NAV_ITEMS.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
              index === activeIndex
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
});
