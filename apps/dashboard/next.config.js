/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
    SOCKET_URL: process.env.SOCKET_URL || 'ws://localhost:3000',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ]
  },
  images: {
    domains: ['localhost', '128.140.7.154'],
  },
}

module.exports = nextConfig