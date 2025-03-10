/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  
  // Disable static page generation for pages that use authentication
  output: 'standalone',
  
  // Additional headers to ensure cookies are handled correctly
  async headers() {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
  
  // Ensure environment variables are passed correctly
  env: {
    AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost',
  },
};
