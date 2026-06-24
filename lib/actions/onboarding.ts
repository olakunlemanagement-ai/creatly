"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";

const completeOnboardingSchema = z.object({
  interest_ids: z.array(z.string().uuid()).max(10),
  display_name: z.string().max(100).optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

/**
 * Server action: marks onboarding complete for a consumer account.
 * Role is always set to 'user' (the DB value for a consumer).
 * Validates interest category IDs against the real categories table.
 */
export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<{ error?: string }> {
  const parsed = completeOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input." };
  }

  const { interest_ids, display_name } = parsed.data;

  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { error: "Not authenticated." };
  }

  const supabase = await createClient();

  // Validate that every supplied category ID actually exists in the DB.
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

  // Using admin client — identity verified; RLS blocks non-admin role column updates.
  type ProfileUpdate = {
    onboarded: boolean;
    role: string;
    full_name?: string;
  };

  const update: ProfileUpdate = { onboarded: true, role: "user" };
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

  redirect("/browse");
}
