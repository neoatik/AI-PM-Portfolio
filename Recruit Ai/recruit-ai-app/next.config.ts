/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3', 'pdf-parse', 'mammoth', 'node-fetch'],
};

export default nextConfig;
