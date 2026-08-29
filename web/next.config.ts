import type { NextConfig } from "next";
import { join } from "node:path";

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: join(__dirname, ".."),
};

export default config;
