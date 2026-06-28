import { createClient } from "@/lib/supabase/server";
import type { Subscription } from "@/types/database";

export type EntitlementResult =
  | { entitled: true; subscription: Subscription }
  | { entitled: false; subscription: null; reason: "no_subscription" | "inactive" };

// Server-side only. Single source of truth for download entitlement (CONVENTIONS §7.2).
// Entitled if: user owns an active subscription OR is an accepted team member of an active subscription.
// Phase 2 Paystack webhooks populate the subscriptions table; this function only reads it.
export async function getUserEntitlement(userId: string): Promise<EntitlementResult> {
  const supabase = await createClient();

  // Check 1: user is the subscription owner
  const { data: owned } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("owner_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (owned) return { entitled: true, subscription: owned };

  // Check 2: user is an accepted member of a team subscription
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("subscription_id, subscriptions!inner(*)")
    .eq("profile_id", userId)
    .eq("invite_accepted", true)
    .eq("subscriptions.status", "active")
    .limit(1)
    .maybeSingle();

  if (teamMember?.subscriptions) {
    const sub = teamMember.subscriptions as unknown as Subscription;

    // Seat enforcement: verify the team has not exceeded its seat limit.
    // Defence-in-depth — the invite endpoint already enforces this at join time.
    const { count: seatCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("subscription_id", teamMember.subscription_id)
      .eq("invite_accepted", true);

    if ((seatCount ?? 0) > sub.max_seats) {
      return { entitled: false, subscription: null, reason: "no_subscription" };
    }

    return { entitled: true, subscription: sub };
  }

  return { entitled: false, subscription: null, reason: "no_subscription" };
}
