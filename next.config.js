/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["firebase", "undici"], // <-- correct top-level location
};

module.exports = nextConfig;
