'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  LayoutDashboard,
  FileWarning,
  Car,
  Settings,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Shield,
  ShieldCheck,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: Route;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard' as Route,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Schaeden',
    href: '/claims' as Route,
    icon: <FileWarning className="h-5 w-5" />,
  },
  {
    title: 'Auswertungen',
    href: '/reports' as Route,
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ['COMPANY_ADMIN', 'SUPERADMIN', 'BROKER'],
  },
  {
    title: 'Firmen',
    href: '/broker/companies' as Route,
    icon: <Building2 className="h-5 w-5" />,
    roles: ['BROKER'],
  },
  {
    title: 'Anfragen',
    href: '/broker/requests' as Route,
    icon: <UserCheck className="h-5 w-5" />,
    roles: ['BROKER'],
  },
  {
    title: 'Fahrzeuge',
    href: '/vehicles' as Route,
    icon: <Car className="h-5 w-5" />,
    roles: ['COMPANY_ADMIN', 'SUPERADMIN', 'BROKER'],
  },
  {
    title: 'Versicherungen',
    href: '/settings/policies' as Route,
    icon: <Shield className="h-5 w-5" />,
    roles: ['COMPANY_ADMIN', 'SUPERADMIN', 'BROKER'],
  },
  {
    title: 'Benutzer',
    href: '/settings/users' as Route,
    icon: <Users className="h-5 w-5" />,
    roles: ['COMPANY_ADMIN', 'SUPERADMIN'],
  },
  {
    title: 'Broker',
    href: '/settings/broker' as Route,
    icon: <Briefcase className="h-5 w-5" />,
    roles: ['COMPANY_ADMIN', 'SUPERADMIN'],
  },
  {
    title: 'Firma',
    href: '/settings/company' as Route,
    icon: <Building2 className="h-5 w-5" />,
    roles: ['COMPANY_ADMIN', 'SUPERADMIN'],
  },
  {
    title: 'Einstellungen',
    href: '/settings' as Route,
    icon: <Settings className="h-5 w-5" />,
    roles: ['COMPANY_ADMIN', 'SUPERADMIN'],
  },
  {
    title: 'Admin-Panel',
    href: '/admin' as Route,
    icon: <ShieldCheck className="h-5 w-5" />,
    roles: ['SUPERADMIN'],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const userRole = user?.role || '';

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-white transition-[width] duration-300 will-change-[width]',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            {collapsed ? (
              <Image
                src="/logo-icon.png"
                alt="POA Logo"
                width={40}
                height={40}
                className="shrink-0"
              />
            ) : (
              <Image
                src="/logo-full.png"
                alt="POA - Point of Accident"
                width={160}
                height={40}
                className="shrink-0"
              />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 px-3 py-4 scrollbar-thin">
          {filteredNavItems.map((item) => {
            // Special handling for settings: only exact match for /settings
            // For other items: match exact or starts with + /
            const isActive = item.href === '/settings'
              ? pathname === '/settings'
              : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.title : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
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
}
