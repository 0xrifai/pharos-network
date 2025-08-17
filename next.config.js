/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Add SSL-related webpack configurations
    config.externals = config.externals || []
    config.externals.push({
      'tls': 'commonjs tls',
      'net': 'commonjs net',
      'crypto': 'commonjs crypto',
    })
    
    return config;
  },
  // Add experimental features for better SSL handling
  experimental: {
    serverComponentsExternalPackages: ['tls', 'net', 'crypto'],
  },
}

module.exports = nextConfig 