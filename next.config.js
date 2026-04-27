/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // ZIP downloads use archiver (Node-only). Mark it external for the server bundler.
  serverExternalPackages: ['archiver'],
};

module.exports = nextConfig;
