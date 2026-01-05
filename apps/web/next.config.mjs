/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for Docker production build
  transpilePackages: ['@poa/shared', '@poa/database'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
