import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "jpsfchpsfmlptkvjsuvk.supabase.co", // add your own supabase link here
      },
    ],
  },
};

export default nextConfig;
