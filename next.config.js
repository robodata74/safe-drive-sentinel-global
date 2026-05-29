 /** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 🧠 REQUIRED for MapLibre + modern packages
  transpilePackages: ["maplibre-gl"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "mapbox-gl": "maplibre-gl",
    };

    // 🚀 safer dev builds (prevents memory spikes)
    config.cache = {
      type: "filesystem",
    };

    return config;
  },
};

module.exports = nextConfig;