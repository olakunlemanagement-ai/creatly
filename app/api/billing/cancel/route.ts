import { getAuthenticatedUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";

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
    // TODO: replace stub once PAYSTACK_SECRET_KEY is available
    // if (sub.paystack_sub_code && process.env.PAYSTACK_SECRET_KEY) {
    //   const res = await fetch(
    //     `https://api.paystack.co/subscription/disable`,
    //     {
    //       method: "POST",
    //       headers: {
    //         Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({ code: sub.paystack_sub_code, token: "<email_token>" }),
    //     }
    //   );
    //   if (!res.ok) {
    //     console.error("[billing/cancel] Paystack disable failed:", await res.text());
    //     return fail("internal_error", "Could not cancel with Paystack. Please try again.", 502);
    //   }
    // }

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
