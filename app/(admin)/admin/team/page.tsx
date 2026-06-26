import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, Crown } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteAdminForm } from "@/components/admin/InviteAdminForm";
import { RemoveAdminButton } from "@/components/admin/RemoveAdminButton";

export const metadata: Metadata = {
  title: `Admin Team — ${APP_NAME}`,
};

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const auth = await getAuthenticatedUser();

  // Second line of defence — middleware is the first
  if (!auth || auth.profile.role !== "super_admin") {
    redirect("/admin/overview");
  }

  const admin = createAdminClient();

  const { data: admins } = await admin
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .in("role", ["admin", "super_admin"])
    .order("created_at", { ascending: true });

  const list = admins ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Admin Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage who has admin access to {APP_NAME}.
        </p>
      </div>

      {/* Admin list */}
      <div className="mb-8 rounded-2xl border border-border bg-card overflow-hidden">
        {list.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">No admins yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green-700/10">
                          {member.role === "super_admin" ? (
                            <Crown className="h-4 w-4 text-brand-green-700" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 text-brand-green-700" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {member.full_name ?? member.email}
                          </p>
                          {member.full_name && (
                            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          member.role === "super_admin"
                            ? "bg-brand-green-700/10 text-brand-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {member.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {new Date(member.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {member.role === "admin" ? (
                        <RemoveAdminButton userId={member.id} email={member.email} />
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

      {/* Invite form */}
      <InviteAdminForm />
    </div>
  );
}
