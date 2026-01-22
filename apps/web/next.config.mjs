/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for Docker production build
  transpilePackages: ['@poa/shared', '@poa/database'],
  experimental: {
    typedRoutes: true,
  },
  // Disable image optimization to reduce server load
  // Images will be served as-is without on-the-fly optimization
  images: {
    unoptimized: true,
  },
  // PERFORMANCE FIX: Aggressive caching headers for static assets
  // This reduces server load significantly by letting browsers cache files
  async headers() {
    return [
      {
        // Static files (JS, CSS) with content hash - cache forever
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Public assets - cache for 1 day
        source: '/:path((?!api).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  // Redirect /favicon.ico to /favicon.png to prevent 404 errors
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.png',
        permanent: true,
      },
    ];
  },
  // PERFORMANCE FIX: Reduce JS bundle size
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // PERFORMANCE FIX: Enable compression
  compress: true,
};

export default nextConfig;
