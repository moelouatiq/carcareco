import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // /_next/image answers 404 on this deployment: in services mode the top-level rewrite hands
    // every path to this service, and the platform's image optimizer is never reached, so the
    // optimized URLs next/image emits resolve to nothing and the logos do not render. Serving the
    // sources directly costs nothing here -- they are a handful of small local assets -- and it
    // keeps <Image> working without a route exception.
    //
    // No remotePatterns either: every <Image> source is a local asset, a data: URI, or the
    // same-origin /api/backend proxy path. Deriving patterns from the API host would also read
    // API_URL at build time, which a service binding only resolves at run time.
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
