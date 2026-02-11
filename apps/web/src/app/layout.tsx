import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { PageLoadingIndicator } from '@/components/ui/page-loading-indicator';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1a2e',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'POA - Point of Accident',
  description: 'KFZ-Schadenmanagement-System für Firmenflotten',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    statusBarStyle: 'default',
    title: 'POA',
  },
  openGraph: {
    title: 'POA - Point of Accident',
    description: 'KFZ-Schadenmanagement-System für Firmenflotten',
    siteName: 'POA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <ServiceWorkerRegister />
        <PageLoadingIndicator />
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
