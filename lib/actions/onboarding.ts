"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { ONBOARDING_ROLES } from "@/types/database";

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

  // Build the profile update — only fields that changed
  type ProfileUpdate = {
    onboarded: boolean;
    role: string;
    full_name?: string;
  };

  const update: ProfileUpdate = { onboarded: true, role };
  if (display_name) {
    update.full_name = display_name;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", auth.user.id);

  if (updateError) {
    console.error("[onboarding] profile update failed:", updateError.message);
    return { error: "Could not save your preferences. Please try again." };
  }

  // Redirect based on role — consumer → browse, creator → creator landing
  // (creator route wired even if it 404s until Phase 1.10)
  redirect(role === "creator" ? "/creators" : "/browse");
}
