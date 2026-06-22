// ============================================================
// SERVICE-ROLE CLIENT — bypasses Row-Level Security entirely.
// This key must NEVER be used to read or write data tables in a user-reachable route
// (subscriptions, downloads, profiles, etc.) — that would defeat RLS.
//
// Legitimate callers (exactly two):
//   1. app/api/webhooks/paystack/route.ts — webhook handler that mutates subscription state.
//   2. lib/download.ts createSignedUrl() — generates a short-lived signed URL for the private
//      resource-files bucket. Storage signed URLs require service-role because authenticated
//      users have no RLS SELECT policy on storage.objects for that bucket (by design —
//      giving them one would let any user bypass the server-side entitlement check).
//      Entitlement is verified in the route handler before this function is called.
// ============================================================
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createAdminClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
