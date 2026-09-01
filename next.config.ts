import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — required for Tauri, which serves the app from disk
  // with no Node server available. Keep every page free of server-only
  // features (route handlers, server actions, dynamic SSR) so this build
  // mode keeps working as the app grows.
  output: "export",
  images: {
    unoptimized: true, // next/image optimization needs a server; disable for export
  },
};

export default nextConfig;
