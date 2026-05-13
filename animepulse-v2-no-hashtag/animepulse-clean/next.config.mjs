/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  trailingSlash: true,
  poweredByHeader: false,
  typescript: {
    // WARNING: Set to true only for initial deployment.
    // Remove this once all TypeScript errors are resolved to avoid shipping broken code silently.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
