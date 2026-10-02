import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Exposes the useOffline() hook from "next/offline" and retries requests
    // that were blocked by connectivity loss, so a dropped connection does not
    // strand the child on a spinner.
    useOffline: true,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          // Never serve a stale worker, or an update can never reach the device.
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        // Narrated lesson audio is per-child and must not sit in a shared cache.
        source: "/api/tts",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;