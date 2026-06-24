import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TeamDashboardClient } from "./TeamDashboardClient";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Team — ${APP_NAME}`,
};

export default async function TeamDashboardPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/dashboard/team");

  const supabase = await createClient();

  // Get the user's team subscription (owner only)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, max_seats, plan_id, team_id")
    .eq("owner_id", auth.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!sub || !sub.team_id || sub.max_seats <= 1) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">No team subscription</h1>
        <p className="mt-3 text-muted-foreground">
          You need an active Team plan to access the team workspace.
        </p>
        <a
          href="/pricing"
          className="mt-6 inline-block rounded-xl bg-brand-green-700 px-6 py-3 text-sm font-semibold text-cream-100 hover:bg-brand-green-800"
        >
          Upgrade to Team →
        </a>
      </div>
    );
  }

  // Fetch team info
  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", sub.team_id)
    .single();

  // Fetch accepted members with profile info
  const { data: members } = await supabase
    .from("team_members")
    .select("id, profile_id, role, accepted_at, profiles(full_name, email, avatar_path)")
    .eq("subscription_id", sub.id)
    .eq("invite_accepted", true)
    .order("accepted_at", { ascending: true });

  // Fetch pending invites
  const { data: invites } = await supabase
    .from("team_invites")
    .select("id, email, expires_at, created_at")
    .eq("team_id", sub.team_id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  // Supabase returns profiles as an array for one-to-many joins; normalize to single object.
  const normalizedMembers: TeamMemberRow[] = (members ?? []).map((m) => ({
    id:         m.id,
    profile_id: m.profile_id,
    role:       m.role,
    accepted_at: m.accepted_at,
    profiles: Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles as { full_name: string | null; email: string; avatar_path: string | null } | null),
  }));

  return (
    <TeamDashboardClient
      teamName={team?.name ?? "My Team"}
      teamId={sub.team_id}
      subscriptionId={sub.id}
      maxSeats={sub.max_seats}
      currentUserId={auth.user.id}
      members={normalizedMembers}
      pendingInvites={(invites ?? []) as PendingInviteRow[]}
    />
  );
}

export type TeamMemberRow = {
  id: string;
  profile_id: string;
  role: string;
  accepted_at: string | null;
  profiles: { full_name: string | null; email: string; avatar_path: string | null } | null;
};

export type PendingInviteRow = {
  id: string;
  email: string;
  expires_at: string;
  created_at: string;
};
