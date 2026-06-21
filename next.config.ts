import type { NextConfig } from "next";

// Parse the Supabase Storage hostname at build time so Next.js <Image> can
// serve preview images from our storage bucket alongside dev seed placeholders.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const nextConfig: NextConfig = {
  images: {
    // Bypass the /_next/image optimizer in dev — picsum.photos isn't reliably
    // reachable through the proxy, causing placeholder images to fail.
    unoptimized: true,
    remotePatterns: [
      // Dev seed placeholder images (picsum.photos)
      { protocol: "https", hostname: "picsum.photos" },
      // Supabase Storage — public preview bucket
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
