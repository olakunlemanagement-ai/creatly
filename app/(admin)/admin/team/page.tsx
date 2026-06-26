import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Crown, ShieldCheck } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteAdminForm } from "@/components/admin/InviteAdminForm";
import { RemoveAdminButton } from "@/components/admin/RemoveAdminButton";

export const metadata: Metadata = {
  title: `Admin Team — ${APP_NAME}`,
};

export const dynamic = "force-dynamic";

// ─── Role badge colours ──────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  super_admin:     "bg-brand-green-700/10 text-brand-green-700",
  content_admin:   "bg-blue-50 text-blue-700",
  creator_admin:   "bg-purple-50 text-purple-700",
  support_admin:   "bg-amber-50 text-amber-700",
  finance_admin:   "bg-emerald-50 text-emerald-700",
  analytics_admin: "bg-slate-100 text-slate-600",
};

function roleStyle(name: string): string {
  return ROLE_STYLES[name] ?? "bg-muted text-muted-foreground";
}

// ─── Types ───────────────────────────────────────────────────────────────────

type RoleInfo = {
  id: string;
  name: string;
  label: string;
  permissions: string[];
};

type TeamMember = {
  teamId: string;
  userId: string;
  joinedAt: string;
  email: string;
  fullName: string | null;
  role: RoleInfo;
  invitedByName: string | null;
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminTeamPage() {
  const auth = await getAuthenticatedUser();

  // Second line of defence — middleware is the first
  if (!auth || auth.profile.role !== "super_admin") {
    redirect("/admin/overview");
  }

  const admin = createAdminClient();

  // Fetch admin_team rows with their role info
  const { data: teamRows } = await admin
    .from("admin_team")
    .select("id, user_id, created_at, invited_by, admin_roles(id, name, label, permissions)")
    .order("created_at", { ascending: true });

  // Batch-fetch profiles for members + inviters
  const allUserIds = [
    ...(teamRows ?? []).map((r) => r.user_id),
    ...(teamRows ?? []).flatMap((r) => (r.invited_by ? [r.invited_by] : [])),
  ];
  const uniqueIds = [...new Set(allUserIds)];

  const { data: profileRows } = uniqueIds.length
    ? await admin.from("profiles").select("id, email, full_name").in("id", uniqueIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profileRows ?? []).map((p) => [p.id, p]));

  const members: TeamMember[] = (teamRows ?? []).map((row) => {
    const role = row.admin_roles as unknown as RoleInfo;
    const profile = profileMap[row.user_id];
    const inviter = row.invited_by ? profileMap[row.invited_by] : null;
    return {
      teamId: row.id,
      userId: row.user_id,
      joinedAt: row.created_at,
      email: profile?.email ?? "—",
      fullName: profile?.full_name ?? null,
      role,
      invitedByName: inviter?.full_name ?? inviter?.email ?? null,
    };
  });

  // All roles except super_admin are available to invite via the form
  const { data: allRoles } = await admin
    .from("admin_roles")
    .select("id, name, label, description, permissions")
    .order("name", { ascending: true });

  const invitableRoles = (allRoles ?? []).filter((r) => r.name !== "super_admin");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Admin Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage who has access to the {APP_NAME} admin panel and what they can do.
        </p>
      </div>

      {/* Current team table */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card">
        {members.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No team members yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Role &amp; permissions
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.teamId} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green-700/10">
                          {member.role.name === "super_admin" ? (
                            <Crown className="h-4 w-4 text-brand-green-700" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 text-brand-green-700" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {member.fullName ?? member.email}
                          </p>
                          {member.fullName && (
                            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                          )}
                          {member.invitedByName && (
                            <p className="text-xs text-muted-foreground/60">
                              Invited by {member.invitedByName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <details className="group">
                        <summary className="list-none cursor-pointer">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleStyle(member.role.name)}`}
                          >
                            {member.role.label}
                          </span>
                          <span className="ml-1.5 text-[10px] text-muted-foreground group-open:hidden">
                            ▸ {(member.role.permissions as string[]).length} permissions
                          </span>
                          <span className="ml-1.5 hidden text-[10px] text-muted-foreground group-open:inline">
                            ▾ hide
                          </span>
                        </summary>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {(member.role.permissions as string[]).map((p) => (
                            <span
                              key={p}
                              className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </details>
                    </td>

                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {new Date(member.joinedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {/* Super admins and the current user cannot be removed */}
                      {member.role.name !== "super_admin" &&
                      member.userId !== auth.user.id ? (
                        <RemoveAdminButton
                          userId={member.userId}
                          email={member.email}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role reference panel */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Available roles</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each role carries a fixed permission set. Roles cannot be customised.
          </p>
        </div>
        <div className="divide-y divide-border">
          {(allRoles ?? []).map((role) => (
            <div key={role.id} className="px-6 py-4">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleStyle(role.name)}`}
                >
                  {role.label}
                </span>
                {role.description && (
                  <span className="text-xs text-muted-foreground">{role.description}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(role.permissions as string[]).map((p) => (
                  <span
                    key={p}
                    className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite form */}
      <InviteAdminForm roles={invitableRoles} />
    </div>
  );
}
