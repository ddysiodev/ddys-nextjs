/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ddys-nextjs'],
  experimental: {
    cacheComponents: true
  }
};

export default nextConfig;
