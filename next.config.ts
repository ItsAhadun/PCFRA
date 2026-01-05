import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Disabled cacheComponents to allow dynamic route segments in dashboard
  cacheComponents: false,
}

export default nextConfig
