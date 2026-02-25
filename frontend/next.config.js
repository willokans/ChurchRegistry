/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use standalone only when deploying (e.g. Docker). For local dev and normal `next start`,
  // omitting this avoids 404s for _next/static assets that can leave the app stuck on "Loading…".
  // output: 'standalone',
};

module.exports = nextConfig;
