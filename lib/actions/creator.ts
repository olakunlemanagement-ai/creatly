"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { applyAsCreatorSchema, updateCreatorProfileSchema } from "@/lib/validations/creator";

// ── applyAsCreator ────────────────────────────────────────────────────────────

export async function applyAsCreator(
  input: z.infer<typeof applyAsCreatorSchema>,
): Promise<{ error?: string; field?: string }> {
  // 1. AUTH
  const auth = await getAuthenticatedUser();
  if (!auth) return { error: "Sign in to apply as a creator." };

  // 2. VALIDATE
  const parsed = applyAsCreatorSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: first?.message ?? "Invalid input.", field: first?.path[0]?.toString() };
  }
  const { handle, display_name, bio, location, website } = parsed.data;

  const supabase = await createClient();

  // 3. AUTHORIZE — already a creator?
  const { data: existingProfile } = await supabase
    .from("creator_profiles")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existingProfile) {
    redirect("/creator");
  }

  // 4. CHECK handle uniqueness
  const { data: handleConflict } = await supabase
    .from("creator_profiles")
    .select("handle")
    .eq("handle", handle)
    .maybeSingle();

  if (handleConflict) {
    return { error: "That handle is already taken. Please choose another.", field: "handle" };
  }

  // 5. EXECUTE — Using admin client for all writes:
  //    (a) creator_profiles insert (sets status based on flag)
  //    (b) creators row upsert (ensures catalogue creator entity exists)
  //    (c) profiles.role update (RLS blocks non-admin role change, per 1.9.5 pattern)
  const admin = createAdminClient();
  const autoApprove = env.CREATOR_AUTO_APPROVE;
  const profileStatus = autoApprove ? "approved" : "pending";

  // Insert creator_profiles row
  const { error: profileError } = await admin.from("creator_profiles").insert({
    user_id: auth.user.id,
    handle,
    display_name,
    bio: bio ?? null,
    location: location ?? null,
    website: website ?? null,
    status: profileStatus,
  });

  if (profileError) {
    if (profileError.code === "23505") {
      return { error: "That handle is already taken.", field: "handle" };
    }
    console.error("[applyAsCreator] creator_profiles insert failed", {
      message: profileError.message,
      code: profileError.code,
    });
    return { error: "Could not create your creator profile. Please try again." };
  }

  // Ensure a catalogue creators row exists (linked by user_id).
  // If the user already has a creators row (e.g. set up by admin), update it.
  // Otherwise insert one. slug = handle for self-onboarded creators.
  const { data: existingCreator } = await admin
    .from("creators")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!existingCreator) {
    const { error: creatorError } = await admin.from("creators").insert({
      user_id: auth.user.id,
      name: display_name,
      slug: handle,
      bio: bio ?? null,
      website_url: website ?? null,
      is_public: autoApprove,
      is_verified: false,
    });

    if (creatorError) {
      console.error("[applyAsCreator] creators insert failed", {
        message: creatorError.message,
        code: creatorError.code,
      });
      // Non-fatal — creator profile row is the source of truth for the apply flow
    }
  } else {
    await admin
      .from("creators")
      .update({ user_id: auth.user.id, is_public: autoApprove })
      .eq("id", existingCreator.id);
  }

  // Update profiles: set role to 'creator' and mark onboarded so the creator
  // layout's !onboarded guard doesn't bounce back to the consumer wizard.
  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "creator", onboarded: true })
    .eq("id", auth.user.id);

  if (roleError) {
    console.error("[applyAsCreator] role update failed", {
      message: roleError.message,
      code: roleError.code,
    });
  }

  redirect("/creator");
}

// ── updateCreatorProfile ──────────────────────────────────────────────────────

export async function updateCreatorProfile(
  input: z.infer<typeof updateCreatorProfileSchema>,
): Promise<{ error?: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { error: "Not authenticated." };

  const parsed = updateCreatorProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }
  const { display_name, bio, location, website } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("creator_profiles")
    .update({
      display_name,
      bio: bio ?? null,
      location: location ?? null,
      website: website ?? null,
    })
    .eq("user_id", auth.user.id);

  if (error) {
    console.error("[updateCreatorProfile] failed", { message: error.message });
    return { error: "Could not save your profile. Please try again." };
  }

  return {};
}
