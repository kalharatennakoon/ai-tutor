import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // TypeScript 7 no longer exposes the compiler API Next.js links against.
    // This makes the build shell out to `tsc` instead. Remove it if you pin
    // TypeScript 6.
    useTypeScriptCli: true,
  },
};

export default nextConfig;
