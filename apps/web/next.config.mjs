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
};

export default nextConfig;
