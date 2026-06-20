// ============================================================
// WEBHOOK HANDLER ONLY.
// This client uses the secret key (sb_secret_…) and bypasses Row-Level Security entirely.
// NEVER import this into any file reachable by a user request.
// The ONLY legitimate caller is: app/api/webhooks/paystack/route.ts
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
