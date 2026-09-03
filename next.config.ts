import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Prisma must stay external to the server bundle (Next 15 key).
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
