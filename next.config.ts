import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Use custom Cloudflare image loader
    loader: 'custom',
    loaderFile: './imageLoader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'slelguoygbfzlpylpxfs.supabase.co',
        port: '',
        pathname: '/storage/v1/**',
      },
      // Add your R2 custom domain here
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Performance optimizations
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  experimental: {
    // Enable optimistic client cache
    optimisticClientCache: true,
    // Optimize package imports
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
// Orchids restart: 1768218015649