const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,

  // HARD STOP: no service worker in dev
  disable: process.env.NODE_ENV !== "production",

  buildExcludes: [/middleware-manifest.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,

  swcMinify: true,

  productionBrowserSourceMaps: false,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  experimental: {
    scrollRestoration: true,

    // reduces hydration memory spikes in large apps
    optimizePackageImports: ["lucide-react", "maplibre-gl"],
  },

  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 1,
  },

  webpack: (config, { dev, isServer }) => {
    /**
     * ==========================================
     * 🔥 CRITICAL MEMORY CONTROL (DEV ONLY)
     * ==========================================
     */
    if (dev) {
      // forces lean module graph
      config.cache = {
        type: "memory",
        maxGenerations: 1,
      };

      config.watchOptions = {
        ignored: ["**/node_modules/**", "**/.next/**"],
      };
    }

    /**
     * ==========================================
     * SAFE FALLBACKS
     * ==========================================
     */
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };

    /**
     * ==========================================
     * PRODUCTION-SAFE CODE SPLITTING
     * ==========================================
     */
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        maxInitialRequests: 20,
        minSize: 20000,

        cacheGroups: {
          /**
           * MAP ENGINE ISOLATION (CRITICAL FIX)
           */
          maplibre: {
            test: /[\\/]node_modules[\\/]maplibre-gl[\\/]/,
            name: "maplibre-core",
            priority: 40,
            enforce: true,
          },

          websocket: {
            test: /[\\/]node_modules[\\/](ws|socket\.io)/,
            name: "realtime-engine",
            priority: 30,
            enforce: true,
          },

          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: "supabase-core",
            priority: 30,
            enforce: true,
          },

          ui: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: "framework",
            priority: 50,
            enforce: true,
          },

          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
});

module.exports = nextConfig;
