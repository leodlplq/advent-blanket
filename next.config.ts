import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DB-backed pages with cookie auth: use the classic dynamic rendering model.
  cacheComponents: false,
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
