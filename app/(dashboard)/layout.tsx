import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ExpiredBanner } from "@/components/shared/ExpiredBanner";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();

  if (!auth) redirect("/login?next=/dashboard");

  if (!auth.profile.onboarded) redirect("/onboarding");

  const supabase = await createClient();

  const [{ count: unreadCount }, { data: sub }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.user.id)
      .eq("is_read", false),
    supabase
      .from("subscriptions")
      .select("max_seats")
      .eq("owner_id", auth.user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const isTeamOwner = (sub?.max_seats ?? 1) > 1;

  return (
    <>
      <ExpiredBanner userId={auth.user.id} />
      <DashboardShell
        userId={auth.user.id}
        fullName={auth.profile.full_name}
        email={auth.user.email}
        avatarPath={auth.profile.avatar_path}
        role={auth.profile.role}
        unreadCount={unreadCount ?? 0}
        isTeamOwner={isTeamOwner}
      >
        {children}
      </DashboardShell>
    </>
  );
}
