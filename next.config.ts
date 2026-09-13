import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { createMDX } from "fumadocs-mdx/next";

// A full Content-Security-Policy needs an allowlist for Clerk, Convex and
// Vercel that has to be tested against every flow, so only frame-ancestors is
// set here. It closes clickjacking on the delete-account and moderation buttons.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

const withMDX = createMDX();

let configToExport = withMDX(nextConfig);

// conditionally enable bundle analyzer
if (process.env.ANALYZE === "true") {
  const bundleAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
  });
  configToExport = bundleAnalyzer(withMDX(nextConfig));
}

export default configToExport;
