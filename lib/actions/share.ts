"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Increments share_count on a resource when a user copies the share link.
 * Best-effort fire-and-forget — never throws.
 */
export async function incrementShareCount(resourceId: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.rpc("increment_share_count", { p_resource_id: resourceId });
  } catch {
    // silently ignore — share tracking must not break UX
  }
}
