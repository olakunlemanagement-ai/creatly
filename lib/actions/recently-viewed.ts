"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const MAX_RECENTLY_VIEWED = 10;

/**
 * Records a resource view for a logged-in user.
 * Upserts (one row per user+resource), then prunes to MAX_RECENTLY_VIEWED.
 * Designed to be fire-and-forget — does not throw on failure.
 */
export async function recordRecentlyViewed(
  userId: string,
  resourceId: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Upsert: update viewed_at if row already exists
    const { error: upsertError } = await supabase
      .from("recently_viewed")
      .upsert(
        { user_id: userId, resource_id: resourceId, viewed_at: new Date().toISOString() },
        { onConflict: "user_id,resource_id" },
      );

    if (upsertError) return;

    // Keep only the 10 most recent — delete any excess rows
    const { data: rows } = await supabase
      .from("recently_viewed")
      .select("id")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false });

    if (rows && rows.length > MAX_RECENTLY_VIEWED) {
      const idsToDelete = rows.slice(MAX_RECENTLY_VIEWED).map((r) => r.id);
      await supabase
        .from("recently_viewed")
        .delete()
        .in("id", idsToDelete);
    }
  } catch {
    // silently ignore — view tracking must not break page render
  }
}

/**
 * Clears all recently viewed entries for a user.
 */
export async function clearRecentlyViewed(userId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("recently_viewed").delete().eq("user_id", userId);
}
