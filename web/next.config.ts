import type { NextConfig } from "next";
import { join } from "node:path";

const apiOrigin = (
  process.env.UNDOX_API_URL ||
  process.env.NEXT_PUBLIC_UNDOX_API_URL ||
  "https://undox-demo.onrender.com"
).replace(/\/$/, "");

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: join(__dirname, ".."),
  async rewrites() {
    return [
      { source: "/backend/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/backend/fixtures/:path*", destination: `${apiOrigin}/fixtures/:path*` },
      { source: "/backend/healthz", destination: `${apiOrigin}/healthz` },
    ];
  },
};

export default config;
