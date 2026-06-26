import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Parse the Supabase Storage hostname at build time so Next.js <Image> can
// serve preview images from our storage bucket alongside dev seed placeholders.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const nextConfig: NextConfig = {
  images: {
    // Bypass the /_next/image optimizer in dev — picsum.photos isn't reliably
    // reachable through the proxy, causing placeholder images to fail.
    // unoptimized: true makes dangerouslyAllowSVG redundant (the optimizer is
    // never invoked), but it's declared explicitly so intent is clear.
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    remotePatterns: [
      // Dev seed placeholder images (picsum.photos)
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
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

export default withSentryConfig(nextConfig, {
  // Suppress the Sentry CLI banner during builds.
  silent: !process.env.CI,
  // Upload source maps only when SENTRY_AUTH_TOKEN is present (production CI).
  // Without the token, source maps are omitted silently rather than erroring.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Disable the Sentry overlay in development to avoid noise.
  disableLogger: true,
  automaticVercelMonitors: false,
});
