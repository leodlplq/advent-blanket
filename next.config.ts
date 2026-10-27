import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DB-backed pages with cookie auth: use the classic dynamic rendering model.
  cacheComponents: false,
  // Minimal self-contained production build (.next/standalone + server.js):
  // the Docker image only needs that folder, so no node_modules install in
  // the runtime stage. Don't forget to copy public/ and .next/static in.
  output: "standalone",
  // Turbopack bundles better-sqlite3 into the server output, so the trace
  // misses the package — standalone scripts (scripts/backup.mjs) still need
  // to resolve it. The second pattern covers the real files under pnpm's
  // .pnpm store when the first only matches a symlink.
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/better-sqlite3/**/*",
      "./node_modules/.pnpm/better-sqlite3*/node_modules/better-sqlite3/**/*",
    ],
  },
  // Allow the dev server to serve assets/HMR over the LAN IP, so the app can
  // be tested from a phone or another device (192.168.x.x) without the
  // dev-resources cross-origin block (exported links / QR testing later).
  allowedDevOrigins: ["192.168.1.188"],
  turbopack: {

    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
