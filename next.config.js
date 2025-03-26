/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure async API request timeouts
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
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