import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api-response";
import { removeMemberSchema } from "@/lib/validations/teams";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(req: NextRequest) {
  try {
    // 1. AUTH
    const auth = await getAuthenticatedUser();
    if (!auth) return fail("unauthorized", "Sign in to continue.", 401);

    // 2. VALIDATE
    const body: unknown = await req.json();
    const parsed = removeMemberSchema.safeParse(body);
    if (!parsed.success) return fail("invalid_input", "Invalid member ID.", 422);

    const { memberId } = parsed.data;

    // 3. AUTHORIZE — caller must own the team subscription this member belongs to
    const supabase = await createClient();
    const { data: member } = await supabase
      .from("team_members")
      .select("id, subscription_id, profile_id, subscriptions!inner(owner_id)")
      .eq("id", memberId)
      .eq("invite_accepted", true)
      .maybeSingle();

    if (!member) return fail("not_found", "Member not found.", 404);

    // Supabase returns the joined table as an array or object depending on the relationship.
    // Use unknown cast to safely access the nested owner_id.
    const rawSub = (member as unknown as { subscriptions: { owner_id: string } | { owner_id: string }[] }).subscriptions;
    const ownerId = Array.isArray(rawSub) ? rawSub[0]?.owner_id : rawSub?.owner_id;
    if (ownerId !== auth.user.id) {
      return fail("forbidden", "Only the team owner can remove members.", 403);
    }

    // Prevent owner from removing themselves
    if (member.profile_id === auth.user.id) {
      return fail("conflict", "You can't remove yourself from the team.", 409);
    }

    // 4. EXECUTE
    const admin = createAdminClient();

    // Remove from team_members
    await admin.from("team_members").delete().eq("id", memberId);

    // Deactivate the member's subscription row (their entitlement lapses immediately)
    await admin
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("owner_id", member.profile_id)
      .eq("team_id", (await getTeamIdForSubscription(admin, member.subscription_id)) ?? "");

    return ok({ message: "Member removed." });
  } catch (err) {
    console.error("[teams/remove-member] unexpected error:", err);
    return fail("internal_error", "Something went wrong.", 500);
  }
}

async function getTeamIdForSubscription(
  admin: ReturnType<typeof createAdminClient>,
  subscriptionId: string
): Promise<string | null> {
  const { data } = await admin
    .from("subscriptions")
    .select("team_id")
    .eq("id", subscriptionId)
    .single();
  return data?.team_id ?? null;
}
