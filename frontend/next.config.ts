import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // No remotePatterns: every <Image> source is a local asset, a data: URI, or the same-origin
    // /api/backend proxy path. Deriving patterns from the API host would also read API_URL at build
    // time, which a service binding only resolves at run time.
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
