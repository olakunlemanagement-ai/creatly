"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { ONBOARDING_ROLES } from "@/types/database";

// The DB check constraint uses 'user' for non-creator accounts (not 'consumer').
// Map the UI value to the DB value here — the only place this translation lives.
const ROLE_DB_MAP = { consumer: "user", creator: "creator" } as const;

// Validate role is only consumer/creator — never admin (server-side guard).
const completeOnboardingSchema = z.object({
  role: z.enum(ONBOARDING_ROLES),
  // interest_ids: UUIDs of chosen categories (validated against DB below)
  interest_ids: z.array(z.string().uuid()).max(10),
  display_name: z.string().max(100).optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

/**
 * Server action: marks onboarding complete, sets role and display name.
 * Validates interest category IDs against the real categories table.
 * Never accepts 'admin' as a role value.
 */
export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<{ error?: string }> {
  const parsed = completeOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input." };
  }

  const { role, interest_ids, display_name } = parsed.data;

  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { error: "Not authenticated." };
  }

  const supabase = await createClient();

  // Validate that every supplied category ID actually exists in the DB.
  // This guards against arbitrary IDs sent from the client.
  if (interest_ids.length > 0) {
    const { count } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .in("id", interest_ids)
      .eq("is_active", true);

    if ((count ?? 0) < interest_ids.length) {
      return { error: "One or more selected categories are invalid." };
    }
  }

  // Using admin client here — identity already verified via getAuthenticatedUser()
  // and inputs validated; user-scoped client cannot update role column due to RLS.
  // (profiles: update policy requires new.role = current_role for non-admins)
  // Map the UI role value to the DB-allowed value ('consumer' → 'user').
  type ProfileUpdate = {
    onboarded: boolean;
    role: string;
    full_name?: string;
  };

  const dbRole = ROLE_DB_MAP[role];
  const update: ProfileUpdate = { onboarded: true, role: dbRole };
  if (display_name) {
    update.full_name = display_name;
  }

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("profiles")
    .update(update)
    .eq("id", auth.user.id);

  if (updateError) {
    console.error("[onboarding] profile update failed", {
      message: updateError.message,
      code: updateError.code,
      details: updateError.details,
      hint: updateError.hint,
    });
    return { error: "Could not save your preferences. Please try again." };
  }

  // Redirect based on role — consumer → browse, creator → creator landing
  // (creator route wired even if it 404s until Phase 1.10)
  redirect(role === "creator" ? "/creators" : "/browse");
}
