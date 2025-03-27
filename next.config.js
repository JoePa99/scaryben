/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel-optimized configuration
  experimental: {
    // Configure async API request timeouts
    serverComponentsExternalPackages: ['socket.io', '@supabase/supabase-js'],
  },
  // Allow Socket.io to work properly
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = [...(config.externals || []), 'bufferutil', 'utf-8-validate'];
    }
    return config;
  },
}

module.exports = nextConfig