/**
 * One-shot seed-data migration: point resource preview_image_path (and
 * preview_images for the phone mockup set) at local /public/seed/ SVGs.
 *
 * Run: node --env-file=.env.local scripts/update-seed-previews.mjs
 *
 * Safe to re-run — targets resources by slug (idempotent UPSERTs via update).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Map: slug → { preview_image_path, preview_images? }
const updates = [
  {
    slug: "bold-gradient-instagram-story-pack",
    preview_image_path: "/seed/social-instagram-story.svg",
  },
  {
    slug: "twitter-x-header-collection",
    preview_image_path: "/seed/social-twitter-header.svg",
  },
  {
    slug: "lagos-display-geometric-sans",
    preview_image_path: "/seed/font-lagos-display.svg",
  },
  {
    slug: "afrobeat-brand-identity-kit",
    preview_image_path: "/seed/brand-afrobeat-kit.svg",
  },
  {
    slug: "cafe-branding-starter-pack",
    preview_image_path: "/seed/brand-cafe-pack.svg",
  },
  {
    slug: "duotone-icon-pack-240",
    preview_image_path: "/seed/icons-duotone.svg",
  },
  {
    slug: "minimal-pitch-deck-template",
    preview_image_path: "/seed/deck-pitch.svg",
  },
  {
    slug: "annual-report-deck-editorial",
    preview_image_path: "/seed/deck-annual-report.svg",
  },
  {
    slug: "t-shirt-mockup-bundle",
    preview_image_path: "/seed/mockup-tshirt.svg",
  },
  {
    slug: "phone-mockup-set-studio-light",
    preview_image_path: "/seed/mockup-phone.svg",
    preview_images: [
      "/seed/mockup-phone-2.svg",
      "/seed/mockup-phone-3.svg",
      "/seed/mockup-phone-4.svg",
    ],
  },
];

let passed = 0;
let failed = 0;

for (const { slug, preview_image_path, preview_images } of updates) {
  const payload = { preview_image_path };
  if (preview_images !== undefined) payload.preview_images = preview_images;

  const { error } = await admin
    .from("resources")
    .update(payload)
    .eq("slug", slug);

  if (error) {
    console.error(`✗ ${slug}:`, error.message);
    failed++;
  } else {
    console.log(`✓ ${slug}`);
    passed++;
  }
}

console.log(`\nDone — ${passed} updated, ${failed} failed.`);
if (failed > 0) process.exit(1);
