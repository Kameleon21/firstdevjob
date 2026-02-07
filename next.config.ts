import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';
import { createMDX } from 'fumadocs-mdx/next';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

const withMDX = createMDX();

let configToExport = withMDX(nextConfig);

// conditionally enable bundle analyzer
if (process.env.ANALYZE === 'true') {
  const bundleAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
  });
  configToExport = bundleAnalyzer(withMDX(nextConfig));
}

export default configToExport;
