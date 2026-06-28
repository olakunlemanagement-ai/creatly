// ============================================================
// SERVICE-ROLE CLIENT — bypasses Row-Level Security entirely.
// This key must NEVER be used to read or write data tables in a user-reachable route
// (subscriptions, downloads, profiles, etc.) — that would defeat RLS.
//
// Legitimate callers (exactly three):
//   1. app/api/webhooks/paystack/route.ts — webhook handler that mutates subscription state.
//   2. lib/download.ts createSignedUrl() — generates a short-lived signed URL for the private
//      resource-files bucket. Storage signed URLs require service-role because authenticated
//      users have no RLS SELECT policy on storage.objects for that bucket (by design —
//      giving them one would let any user bypass the server-side entitlement check).
//      Entitlement is verified in the route handler before this function is called.
//   3. lib/actions/creator-signup.ts — (a) uses admin.generateLink() to create creator accounts
//      without triggering Supabase's default verification email (we send our own via Resend);
//      (b) immediately sets role='creator' on the new profile so middleware never routes
//      the creator through the consumer flow, even before email verification.
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
