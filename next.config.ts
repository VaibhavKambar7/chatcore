import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {},
  serverComponentsExternalPackages: ["pdf-parse"],
};

export default nextConfig;
