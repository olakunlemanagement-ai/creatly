"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { APP_NAME, APP_URL, SUPPORT_EMAIL } from "@/lib/config";
import { creatorSignupSchema, type CreatorSignupInput } from "@/lib/validations/auth";
import { buildCreatorVerificationEmail } from "@/lib/emails/creator-verification";

export async function creatorSignup(
  values: CreatorSignupInput,
): Promise<{ ok: true } | { error: string }> {
  const parsed = creatorSignupSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid input." };
  }

  const { email, password, full_name } = parsed.data;
  const supabase = createAdminClient();

  // generateLink creates the user without sending Supabase's default email,
  // giving us the action_link to embed in our own branded email.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      redirectTo: `${APP_URL}/auth/callback?next=/creators/apply`,
      data: { full_name, signup_type: "creator" },
    },
  });

  // Treat "already registered" as success to prevent email enumeration.
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { ok: true };
    }
    console.error("[creatorSignup] generateLink error:", error.message);
    return { error: "Something went wrong. Please try again." };
  }

  const confirmationUrl = data.properties.action_link;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${APP_NAME} <${SUPPORT_EMAIL}>`,
      to: email,
      subject: `Confirm your creator account — ${APP_NAME}`,
      html: buildCreatorVerificationEmail(confirmationUrl),
    }),
  });

  if (!res.ok) {
    console.error("[creatorSignup] Resend error:", await res.text());
    return { error: "Failed to send verification email. Please try again." };
  }

  return { ok: true };
}
