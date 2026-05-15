/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Skip Next's image optimization — we already pre-compress all assets to
    // web-friendly sizes (gallery JPGs ~150KB, logo ~110KB), and Railway's
    // edge proxy was returning 400 on /_next/image requests.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};
module.exports = nextConfig;
