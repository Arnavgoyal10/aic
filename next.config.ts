import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  // Allow yahoo-finance2 to run in API routes
  serverExternalPackages: ["yahoo-finance2"],
};

export default nextConfig;
