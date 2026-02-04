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
  dashboard: <LayoutDashboard className="h-6 w-6" />,
  claims: <FileWarning className="h-6 w-6" />,
  chat: <MessageCircle className="h-6 w-6" />,
  profile: <User className="h-6 w-6" />,
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-[0_-1px_3px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex h-16 items-center justify-around">
        {NAV_ITEMS.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 text-[11px] tracking-tight transition-colors',
              index === activeIndex
                ? 'text-primary font-semibold'
                : 'text-muted-foreground/70'
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
