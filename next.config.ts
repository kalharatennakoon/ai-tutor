import type { NextConfig } from "next";

/**
 * GitHub Pages serves static files only, so the Pages build runs with
 * NEXT_PUBLIC_STATIC_EXPORT=true and swaps on `output: "export"`.
 *
 * A project site lives at https://<user>.github.io/<repo>/, so every asset and
 * link needs a basePath prefix or it 404s. The workflow derives it from the
 * repository name; the fallback keeps a manual `npm run build:static` working.
 *
 * Local dev and a normal `next build` set neither variable, so they are
 * unaffected and keep the API route.
 */
const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // TypeScript 7 no longer exposes the compiler API Next.js links against.
    // This makes the build shell out to `tsc` instead. Remove it if you pin
    // TypeScript 6.
    useTypeScriptCli: true,
  },
  ...(isStaticExport
    ? {
        output: "export" as const,
        basePath,
        // Pages resolves /foo/ to /foo/index.html; without this, nested
        // routes 404 on direct navigation or refresh.
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
