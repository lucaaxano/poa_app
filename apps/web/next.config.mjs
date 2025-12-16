/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@poa/shared', '@poa/database'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
