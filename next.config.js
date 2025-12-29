/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow serving images from the local uploads directory (for dev/demo)
  // In production/Vercel, we'd use external storage URLs.
  // We will setup a route handler for serving files if we use local FS.
};

module.exports = nextConfig;
