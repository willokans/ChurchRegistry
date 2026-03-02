/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output is required for the Docker/Fly.io image. Only enable when building for deploy
  // so local dev and CI (npm run build) are unchanged. Dockerfile sets BUILD_STANDALONE=1.
  ...(process.env.BUILD_STANDALONE === '1' ? { output: 'standalone' } : {}),
};

module.exports = nextConfig;
