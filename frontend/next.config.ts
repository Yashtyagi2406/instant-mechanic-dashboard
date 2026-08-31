import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from any remote source (for potential future use)
  images: {
    remotePatterns: [],
  },
  // External packages that should not be bundled (server components only)
  serverExternalPackages: [],
};

export default nextConfig;
