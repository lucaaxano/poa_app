'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Header } from '@/components/layout/header';
import { ErrorBoundary } from '@/components/error-boundary';
import { useAuthStore } from '@/stores/auth-store';
import { warmupApi } from '@/lib/api/client';
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // PERFORMANCE FIX: Use granular selectors to prevent unnecessary re-renders
  // Each selector only triggers re-render when that specific value changes
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const userRole = useAuthStore((state) => state.user?.role);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auto-close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // PERFORMANCE FIX: Non-blocking API warmup - fire and forget
  useEffect(() => {
    if (isAuthenticated && userRole === 'SUPERADMIN') {
      warmupApi().catch(() => {});
    }
  }, [isAuthenticated, userRole]);

  // Redirect if not authenticated or not SUPERADMIN
  useEffect(() => {
    // Only redirect after initialization is complete
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace('/login');
    } else if (userRole !== 'SUPERADMIN') {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isInitialized, router, userRole]);

  // OPTIMIZED: Single loading check - only show spinner when truly necessary
  if (!isInitialized || (!isAuthenticated && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  // If not authenticated or not SUPERADMIN (after init), show loading while redirect happens
  if (!isAuthenticated || userRole !== 'SUPERADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-background transition-transform duration-200 lg:hidden',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <AdminSidebar
          collapsed={false}
          onCollapsedChange={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'transition-[margin-left] duration-200',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <Header
          showMenuButton
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="p-4 sm:p-6 lg:p-8 pb-[env(safe-area-inset-bottom)]">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
