import type { NextConfig } from 'next';
// The single exported route stays at the artifact root. GitHub Pages supplies
// its repository mount; assetPrefix and dataAsset supply public URL prefixes.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
};
export default nextConfig;
