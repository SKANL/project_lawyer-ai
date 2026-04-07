import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: {
    // Next.js 16 optimizations
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ytvmdjnxdvzjiuuizijt.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
