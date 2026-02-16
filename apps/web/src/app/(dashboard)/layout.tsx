'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ErrorBoundary } from '@/components/error-boundary';
import { useAuthStore } from '@/stores/auth-store';
import { warmupApi, SESSION_EXPIRED_EVENT } from '@/lib/api/client';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
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
  const [apiUnavailable, setApiUnavailable] = useState(false);

  // Auto-close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Listen for API server errors to show/hide connection banner
  const handleSessionEvent = useCallback((event: Event) => {
    const { reason } = (event as CustomEvent<{ reason: string }>).detail;
    if (reason === 'server_error' || reason === 'network_error') {
      setApiUnavailable(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionEvent);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionEvent);
  }, [handleSessionEvent]);

  // Periodic retry: when API is unavailable, retry every 15s until it recovers
  useEffect(() => {
    if (!apiUnavailable) return;
    const interval = setInterval(async () => {
      const ok = await warmupApi(true);
      if (ok) setApiUnavailable(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [apiUnavailable]);

  // PERFORMANCE FIX: Non-blocking API warmup - fire and forget
  // Don't block the dashboard on warmup - let it load immediately
  // The warmup just helps with subsequent requests
  useEffect(() => {
    if (isAuthenticated && userRole !== 'SUPERADMIN') {
      // Fire and forget - don't wait for warmup
      warmupApi().catch(() => {});
    }
  }, [isAuthenticated, userRole]);

  // Redirect to login if not authenticated, or to admin if SUPERADMIN
  useEffect(() => {
    // Only redirect after initialization is complete
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace('/login');
    } else if (userRole === 'SUPERADMIN') {
      router.replace('/admin');
    }
  }, [isAuthenticated, isInitialized, router, userRole]);

  // OPTIMIZED: Single loading check - only show spinner when truly necessary
  if (!isInitialized || (!isAuthenticated && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If not authenticated (after init), return nothing while redirect happens
  if (!isAuthenticated || userRole === 'SUPERADMIN') {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-muted/30 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
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
        <Sidebar
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
          hideMenuOnMobile
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        {apiUnavailable && (
          <div className="mx-4 mt-2 sm:mx-6 lg:mx-8 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200 flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent shrink-0" />
            System wird aktualisiert... Bitte warten Sie einen Moment.
          </div>
        )}
        <main className="p-4 sm:p-6 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6 lg:pb-8 overflow-hidden">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      {/* Bottom Navigation — rendered outside the main content wrapper
          so no ancestor transform/transition can break position:fixed */}
      <BottomNav />
    </div>
  );
}
