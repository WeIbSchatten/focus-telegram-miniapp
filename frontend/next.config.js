/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_FOCUS_API_URL: process.env.NEXT_PUBLIC_FOCUS_API_URL || '',
    NEXT_PUBLIC_KIDS_API_URL: process.env.NEXT_PUBLIC_KIDS_API_URL || '',
    NEXT_PUBLIC_SENSE_API_URL: process.env.NEXT_PUBLIC_SENSE_API_URL || '',
    NEXT_PUBLIC_TELEGRAM_BOT_NAME: process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '',
  },
  async rewrites() {
    // REWRITE_* — адреса бэкендов для прокси (при сборке в Docker: имена сервисов)
    // NEXT_PUBLIC_* — для клиента; пустые = относительные /api-focus, /api-kids, /api-sense
    const focusUrl = process.env.REWRITE_FOCUS_URL || process.env.NEXT_PUBLIC_FOCUS_API_URL || 'http://localhost:3001';
    const kidsUrl = process.env.REWRITE_KIDS_URL || process.env.NEXT_PUBLIC_KIDS_API_URL || 'http://localhost:8001';
    const senseUrl = process.env.REWRITE_SENSE_URL || process.env.NEXT_PUBLIC_SENSE_API_URL || 'http://localhost:8002';
    return [
      { source: '/api-focus/:path*', destination: `${focusUrl}/api/:path*` },
      { source: '/api-kids/:path*', destination: `${kidsUrl}/api/:path*` },
      { source: '/api-sense/:path*', destination: `${senseUrl}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
