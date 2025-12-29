import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Avoid workspace-root mis-detection (and keep config runtime-compatible).
    root: process.cwd(),
  },
};

export default nextConfig;
