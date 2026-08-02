import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a wasm/native binding we don't want webpack to bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
  // Pin the workspace root to this project (a stray lockfile lives higher up).
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
