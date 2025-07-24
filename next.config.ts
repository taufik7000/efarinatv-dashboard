import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Konfigurasi headers untuk caching
  async headers() {
    return [
      {
        // Cache untuk static assets (gambar, font, dll)
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 tahun
          },
        ],
      },
      {
        // Cache untuk CSS dan JS files
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 tahun
          },
        ],
      },
      {
        // Cache untuk API routes yang jarang berubah
        source: '/api/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600', // 1 jam
          },
        ],
      },
      {
        // No cache untuk API routes yang dinamis
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Konfigurasi untuk optimasi gambar
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Eksperimental features untuk performa
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output configuration
  output: 'standalone',
};

export default nextConfig;