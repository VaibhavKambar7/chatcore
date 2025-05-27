import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {},
  serverComponentsExternalPackages: ["pdf-parse"],
  // output: 'standalone',
};

export default nextConfig;
