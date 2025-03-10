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
    // Auth URLs
    AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost',
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost',
    
    // WebSocket URL
    WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:80/ws',
    
    // Debug settings
    DEBUG: process.env.DEBUG || 'false',
    VERBOSE_LOGGING: process.env.VERBOSE_LOGGING || 'false',
  },
};
