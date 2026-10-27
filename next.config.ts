import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DB-backed pages with cookie auth: use the classic dynamic rendering model.
  cacheComponents: false,
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
