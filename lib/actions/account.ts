"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AccountActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string };

// ── Change password ──────────────────────────────────────────────────────────

const changePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

export async function changePassword(
  _prev: AccountActionState | null,
  formData: FormData,
): Promise<AccountActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, error: "Not authenticated" };

  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm:  formData.get("confirm"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Password updated. Please sign in again." };
}

// ── Change email ─────────────────────────────────────────────────────────────

const changeEmailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export async function changeEmail(
  _prev: AccountActionState | null,
  formData: FormData,
): Promise<AccountActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, error: "Not authenticated" };

  const parsed = changeEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid email" };
  }

  if (parsed.data.email === auth.user.email) {
    return { ok: false, error: "That is already your current email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: parsed.data.email });
  if (error) return { ok: false, error: error.message };

  return { ok: true, message: `Verification sent to ${parsed.data.email}.` };
}

// ── Delete account ───────────────────────────────────────────────────────────
// Uses admin client to delete the auth.users row (which cascades to profiles via DB trigger).
// Legitimate use: user-initiated hard delete after typed confirmation — identity confirmed by
// getAuthenticatedUser() before the admin call, matching the 1.9.5 pattern.

const deleteAccountSchema = z.object({
  confirm: z.literal("DELETE", {
    errorMap: () => ({ message: 'Type "DELETE" to confirm.' }),
  }),
});

export async function deleteAccount(
  _prev: AccountActionState | null,
  formData: FormData,
): Promise<AccountActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, error: "Not authenticated" };

  const parsed = deleteAccountSchema.safeParse({ confirm: formData.get("confirm") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Type "DELETE" to confirm.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) return { ok: false, error: "Account deletion failed. Please contact support." };

  // Sign the current session out (best-effort; the user row is already gone)
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/");
}
