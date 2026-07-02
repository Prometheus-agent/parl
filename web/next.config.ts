import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Proxy API requests to Rust backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8080/api/:path*",
      },
      {
        source: "/health",
        destination: "http://127.0.0.1:8080/health",
      },
    ];
  },
};

export default nextConfig;
