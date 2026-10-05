import type { NextConfig } from "next";

// KE_PAGES_EXPORT=1 → ekspor statis khusus demo untuk Cloudflare Pages
// (dijalankan lewat scripts/pages-export.js). Tanpa env itu: build Next
// normal (server, node:sqlite) untuk lokal/VPS.
const nextConfig: NextConfig = process.env.KE_PAGES_EXPORT
  ? {
      output: "export",
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {};

export default nextConfig;
