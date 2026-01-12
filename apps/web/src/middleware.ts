import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/claims', '/vehicles', '/settings', '/profile'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/accept-invitation'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for access token in cookies or localStorage is handled client-side
  // Here we check for a session cookie that might be set
  const token = request.cookies.get('poa_access_token')?.value;

  // For protected routes, we'll handle auth check client-side via AuthProvider
  // This middleware is mainly for basic redirection

  // If trying to access auth routes while having a token, redirect to dashboard
  // Note: This is a basic check - full auth validation happens client-side
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    // We can't reliably check localStorage in middleware
    // Let the client-side handle redirection for authenticated users
    return NextResponse.next();
  }

  // For protected routes, let the AuthProvider handle the check
  // as we're using localStorage for token storage
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
