import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api-response";
import { acceptInviteSchema } from "@/lib/validations/teams";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    // 1. AUTH
    const auth = await getAuthenticatedUser();
    if (!auth) return fail("unauthorized", "Sign in to continue.", 401);

    // 2. VALIDATE
    const body: unknown = await req.json();
    const parsed = acceptInviteSchema.safeParse(body);
    if (!parsed.success) return fail("invalid_input", "Invalid invite token.", 422);

    const { token } = parsed.data;

    // 3. Verify the invite — must be valid, unaccepted, and not expired
    const supabase = await createClient();
    const { data: invite } = await supabase
      .from("team_invites")
      .select("id, team_id, accepted_at, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!invite) return fail("not_found", "Invite not found or already used.", 404);
    if (invite.accepted_at) return fail("conflict", "This invite has already been accepted.", 409);
    if (new Date(invite.expires_at) < new Date()) {
      return fail("gone", "This invite has expired. Ask the team owner to send a new one.", 410);
    }

    // Get the team → subscription linkage
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, owner_id, max_seats, plan_id")
      .eq("team_id", invite.team_id)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) return fail("not_found", "No active team subscription found.", 404);

    // Seat limit check
    const { count: memberCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("subscription_id", sub.id)
      .eq("invite_accepted", true);

    if ((memberCount ?? 0) >= sub.max_seats) {
      return fail("conflict", "This team is full. Ask the owner to upgrade their plan.", 409);
    }

    // 4. EXECUTE — use admin client for writes that cross RLS boundaries
    // The admin client is used here because:
    // (a) inserting a team_members row requires linking to another user's subscription
    // (b) upserting a subscription for the invitee bypasses the subscription RLS (webhook-only writer)
    // Identity is verified above via getAuthenticatedUser() + invite token.
    const admin = createAdminClient();

    // Add to team_members
    const { error: memberError } = await admin.from("team_members").upsert(
      {
        subscription_id: sub.id,
        profile_id:      auth.user.id,
        role:            "member",
        invited_email:   auth.user.email,
        invite_accepted: true,
        accepted_at:     new Date().toISOString(),
      },
      { onConflict: "subscription_id,profile_id" }
    );

    if (memberError) {
      console.error("[teams/accept] team_members upsert error:", memberError);
      return fail("internal_error", "Could not add you to the team.", 500);
    }

    // Upsert a subscription row for this member so entitlement passes
    await admin.from("subscriptions").upsert(
      {
        owner_id:     auth.user.id,
        plan_id:      sub.plan_id,
        plan_type:    sub.plan_id ?? "team_monthly",
        amount_kobo:  0,              // member doesn't pay directly
        max_seats:    1,
        status:       "active",
        team_id:      invite.team_id,
        updated_at:   new Date().toISOString(),
      },
      { onConflict: "owner_id" }
    );

    // Mark the invite accepted
    await admin
      .from("team_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    return ok({ message: "Welcome to the team!" });
  } catch (err) {
    console.error("[teams/accept] unexpected error:", err);
    return fail("internal_error", "Something went wrong.", 500);
  }
}
