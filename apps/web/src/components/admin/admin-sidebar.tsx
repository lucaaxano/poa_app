'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileWarning,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: Route;
  icon: React.ReactNode;
}

const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin' as Route,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Firmen',
    href: '/admin/companies' as Route,
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    title: 'Benutzer',
    href: '/admin/users' as Route,
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: 'Schaeden',
    href: '/admin/claims' as Route,
    icon: <FileWarning className="h-5 w-5" />,
  },
  {
    title: 'Versicherer',
    href: '/admin/insurers' as Route,
    icon: <Shield className="h-5 w-5" />,
  },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const AdminSidebar = memo(function AdminSidebar({ collapsed = false, onCollapsedChange }: AdminSidebarProps) {
  const pathname = usePathname();

  // Memoize nav items with active state to prevent recalculation
  const navItemsWithStatus = useMemo(
    () => adminNavItems.map((item) => ({
      ...item,
      isActive: item.href === ('/admin' as Route)
        ? pathname === '/admin'
        : pathname === item.href || pathname.startsWith(item.href + '/')
    })),
    [pathname]
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-white transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
      style={{ contain: 'layout style' }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b px-4">
          <Link href={'/admin' as Route} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white font-bold text-lg">
              A
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold tracking-tight">Admin</span>
            )}
          </Link>
        </div>

        {/* Back to Dashboard */}
        <div className="shrink-0 px-3 pt-4 pb-2">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? 'Zurueck zum Dashboard' : undefined}
          >
            <ArrowLeft className="h-5 w-5" />
            {!collapsed && <span>Zurueck zum Dashboard</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 px-3 py-2 scrollbar-thin">
          {navItemsWithStatus.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                item.isActive
                  ? 'bg-red-600 text-white shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.title : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>

        {/* Collapse Button */}
        <div className="shrink-0 border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full rounded-xl text-muted-foreground hover:text-foreground',
              collapsed ? 'px-2' : 'justify-start'
            )}
            onClick={() => onCollapsedChange?.(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Einklappen</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
});
