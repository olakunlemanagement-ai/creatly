"use server";

import { createClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/config";
import { creatorSignupSchema, type CreatorSignupInput } from "@/lib/validations/auth";

export async function creatorSignup(
  values: CreatorSignupInput,
): Promise<{ ok: true } | { error: string }> {
  const parsed = creatorSignupSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid input." };
  }

  const { email, password, full_name } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${APP_URL}/auth/callback?next=/creators/apply`,
      data: { signup_type: "creator", full_name },
    },
  });

  // Treat "already registered" as success to prevent email enumeration.
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { ok: true };
    }
    console.error("[creatorSignup] signUp error:", error.message);
    return { error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}
