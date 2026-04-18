import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Temporarily ignore build errors due to Windows case-sensitivity issue with Pages directory
    ignoreBuildErrors: true,
  },
  // Workaround: Next.js is trying to pre-render components from Pages directory
  // These components use AuthProvider/ToastProvider which aren't available during build
  // The pages that import them already have 'export const dynamic = "force-dynamic"'
  // but Next.js still tries to analyze the components during build
  // Solution: Use standalone output for local builds only, not for Vercel
  // Vercel uses its own deployment system and doesn't need standalone
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    // Cache static assets
    {
      urlPattern: /\/_next\/static.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-cache",
        expiration: {
          maxEntries: 100,
        },
      },
    },
    // Cache images
    {
      urlPattern: /\/_next\/image.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
        },
      },
    },
    // Cache attendance page - use StaleWhileRevalidate for better offline support
    // Serves from cache immediately, then updates in background
    {
      urlPattern: /\/dashboard\/attendance.*/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "attendance-page-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache /attendance route (for assistants) - use StaleWhileRevalidate
    {
      urlPattern: /\/attendance.*/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "attendance-page-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache session pages - use StaleWhileRevalidate for offline support
    {
      urlPattern: /\/dashboard\/sessions\/.*/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "session-pages-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache other dashboard pages with StaleWhileRevalidate - serves from cache immediately
    {
      urlPattern: ({ request }) => {
        return (
          request.destination === "document" &&
          !request.url.includes("/api/") &&
          !request.url.includes("/_next/") &&
          !request.url.includes("/dashboard/attendance") && // Already handled above
          !request.url.includes("/dashboard/sessions/") && // Already handled above
          !request.url.includes("/offline") && // Don't cache offline page itself
          request.url.includes("/dashboard") // Only cache dashboard pages
        );
      },
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "dashboard-pages-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache other pages with NetworkFirst strategy - try network first, fallback to cache
    {
      urlPattern: ({ request }) => {
        return (
          request.destination === "document" &&
          !request.url.includes("/api/") &&
          !request.url.includes("/_next/") &&
          !request.url.includes("/dashboard") && // Already handled above
          !request.url.includes("/offline") // Don't cache offline page itself
        );
      },
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
        networkTimeoutSeconds: 3, // Try network for 3 seconds, then use cache
      },
    },
    // Handle Next.js RSC (React Server Components) requests
    {
      urlPattern: /\/_next\/data\/.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "next-data-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // DO NOT cache API routes - they should always go to network
    {
      urlPattern: /\/api\/.*/,
      handler: "NetworkOnly",
      options: {
        cacheName: "api-cache",
      },
    },
  ],
  // Remove fallback document - use OfflineGuard component instead
  // This prevents Service Worker from redirecting to /offline page
  // fallbacks: {
  //   document: "/offline",
  // },
  buildExcludes: [/middleware-manifest\.json$/],
  // Exclude API routes from service worker scope
  publicExcludes: ["!api/**/*"],
});

export default pwaConfig(nextConfig);
