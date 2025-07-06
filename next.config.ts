import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  /* config options here */
};

let configToExport = nextConfig;

// conditionally enable bundle analyzer
if (process.env.ANALYZE === 'true') {
  const bundleAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
  });
  configToExport = bundleAnalyzer(nextConfig)
}

export default configToExport;
