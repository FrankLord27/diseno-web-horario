import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@horarios/shared-types"],
};

export default nextConfig;
