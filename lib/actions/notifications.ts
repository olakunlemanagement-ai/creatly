"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();

export async function markNotificationRead(notificationId: string): Promise<void> {
  const auth = await getAuthenticatedUser();
  if (!auth) return;

  const parsed = idSchema.safeParse(notificationId);
  if (!parsed.success) return;

  const supabase = await createClient();
  // RLS ensures only own rows are updated
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", parsed.data)
    .eq("user_id", auth.user.id);

  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
  const auth = await getAuthenticatedUser();
  if (!auth) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", auth.user.id)
    .eq("is_read", false);

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}

// ── Notification preferences ─────────────────────────────────────────────────

const ALLOWED_FREQ = ["instant", "daily", "weekly", "never"] as const;
type Freq = (typeof ALLOWED_FREQ)[number];

const prefsSchema = z.object({
  email_new_resources:        z.boolean(),
  email_renewal_reminders:    z.boolean(),
  email_subscription_events:  z.boolean(),
  email_payment_failed:       z.boolean(),
  email_team_events:          z.boolean(),
  email_new_resources_freq:   z.enum(ALLOWED_FREQ),
});

export type SavePrefsState = { ok: true } | { ok: false; error: string };

export async function saveNotificationPreferences(
  _prev: SavePrefsState | null,
  formData: FormData,
): Promise<SavePrefsState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, error: "Not authenticated" };

  const parsed = prefsSchema.safeParse({
    email_new_resources:       formData.get("email_new_resources") === "on",
    email_renewal_reminders:   formData.get("email_renewal_reminders") === "on",
    email_subscription_events: formData.get("email_subscription_events") === "on",
    email_payment_failed:      formData.get("email_payment_failed") === "on",
    email_team_events:         formData.get("email_team_events") === "on",
    email_new_resources_freq:  (formData.get("email_new_resources_freq") ?? "weekly") as Freq,
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid preferences." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: auth.user.id, ...parsed.data, updated_at: new Date().toISOString() }, {
      onConflict: "user_id",
    });

  if (error) return { ok: false, error: "Failed to save preferences." };

  revalidatePath("/dashboard/notifications/preferences");
  return { ok: true };
}
