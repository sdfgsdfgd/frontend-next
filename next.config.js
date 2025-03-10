/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false, // Disable strict mode for NextAuth compatibility
  
  // Disable static page generation for pages that use authentication
  output: 'standalone',
  
  // Configure which paths should be static vs dynamic
  experimental: {
    serverComponentsExternalPackages: ['next-auth'],
  },
  
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
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
};
