/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Force clean builds in development
  distDir: '.next',
};

export default nextConfig;
