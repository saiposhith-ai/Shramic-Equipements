/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["firebase", "undici"],
  output: "export", // ✅ combine everything into one config object
};

module.exports = nextConfig;
