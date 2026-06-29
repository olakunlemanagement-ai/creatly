import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail } from "@/lib/api-response";

// Exception to the webhook-only subscription-write rule: free trials have no
// Paystack payment, so cannot go through the webhook flow. Identity is verified
// via getAuthenticatedUser() before the admin client writes any row.

const TRIAL_DAYS = 7;

export async function POST() {
  // ── Auth ──────────────────────────────────────────────────────────────────────
  const auth = await getAuthenticatedUser();
  if (!auth) return fail("unauthorized", "Not signed in", 401);

  const userId = auth.user.id;
  const profile = auth.profile as unknown as { trial_used?: boolean };

  // ── Validate: one trial per user, ever ──────────────────────────────────────
  if (profile.trial_used) {
    return fail("trial_already_used", "You have already used your free trial.", 409);
  }

  // ── Validate: no active subscription ────────────────────────────────────────
  const supabaseAdmin = createAdminClient();

  const { data: existingSub } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("owner_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (existingSub) {
    return fail("already_subscribed", "You already have an active subscription.", 409);
  }

  // ── Create trial subscription ────────────────────────────────────────────────
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { error: insertError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      owner_id: userId,
      status: "active",
      plan_id: "monthly",
      plan_type: "monthly",
      paystack_subscription_code: null,
      paystack_customer_code: null,
      current_period_start: now.toISOString(),
      current_period_end: expiresAt.toISOString(),
      is_trial: true,
    } as object);

  if (insertError) {
    return fail("insert_failed", "Could not start trial. Please try again.", 500);
  }

  // ── Mark trial as used on profile ───────────────────────────────────────────
  await supabaseAdmin
    .from("profiles")
    .update({ trial_used: true } as object)
    .eq("id", userId);

  return NextResponse.json({ ok: true, expires_at: expiresAt.toISOString() });
}
