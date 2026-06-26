import { getAuthenticatedUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function POST() {
  try {
    // 1. AUTH
    const auth = await getAuthenticatedUser();
    if (!auth) return fail("unauthorized", "Sign in to continue.", 401);

    // 2. Get active subscription
    const supabase = await createClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_end, paystack_sub_code, cancel_at")
      .eq("owner_id", auth.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) return fail("not_found", "No active subscription found.", 404);
    if (sub.cancel_at) return fail("conflict", "Subscription is already scheduled for cancellation.", 409);

    // 3. Paystack subscription disable (soft cancel — access continues to period end)
    // Only needed when there is a Paystack recurring subscription attached.
    // One-time purchases (no sub code) are cancelled locally only.
    if (sub.paystack_sub_code) {
      // Fetch the subscription from Paystack to obtain the email_token required for disable.
      const fetchRes = await fetch(
        `https://api.paystack.co/subscription/${sub.paystack_sub_code}`,
        { headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` } }
      );
      const fetchData = (await fetchRes.json()) as { status: boolean; data?: { email_token?: string } };

      if (!fetchData.status || !fetchData.data?.email_token) {
        console.error("[billing/cancel] Could not fetch Paystack subscription:", fetchData);
        return fail("internal_error", "Could not cancel with Paystack. Please try again.", 502);
      }

      const disableRes = await fetch("https://api.paystack.co/subscription/disable", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: sub.paystack_sub_code, token: fetchData.data.email_token }),
      });

      if (!disableRes.ok) {
        console.error("[billing/cancel] Paystack disable failed:", await disableRes.text());
        return fail("internal_error", "Could not cancel with Paystack. Please try again.", 502);
      }
    }

    // 4. Set cancel_at = current_period_end (access until period end — status stays 'active')
    // The webhook subscription.disable will set status='cancelled' when the period actually ends.
    const cancelAt = sub.current_period_end ?? new Date().toISOString();
    const { error } = await supabase
      .from("subscriptions")
      .update({ cancel_at: cancelAt, updated_at: new Date().toISOString() })
      .eq("id", sub.id);

    if (error) {
      console.error("[billing/cancel] update error:", error);
      return fail("internal_error", "Could not cancel subscription.", 500);
    }

    return ok({ cancel_at: cancelAt });
  } catch (err) {
    console.error("[billing/cancel] unexpected error:", err);
    return fail("internal_error", "Something went wrong.", 500);
  }
}
