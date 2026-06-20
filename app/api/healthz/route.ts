// TEMPORARY SMOKE TEST — verifies Supabase connection end-to-end.
// Hit GET /api/healthz after filling in .env.local to confirm connectivity.
// Remove this file (or gate it to admin-only) before go-live.
import { createClient } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api-response";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    if (error) {
      return fail("supabase_unreachable", error.message, 503);
    }
    return ok({ connected: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return fail("connection_failed", message, 503);
  }
}
