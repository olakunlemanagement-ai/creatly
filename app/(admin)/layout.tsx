import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

// All routes under (admin) require authentication AND admin role.
// The middleware already enforces auth; this layout adds the role check so
// non-admin authenticated users are redirected (not leaked a 401/404).
export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();

  if (!auth) redirect("/login?next=/admin");

  if (auth.profile.role !== "admin") redirect("/dashboard");

  return (
    <AdminShell fullName={auth.profile.full_name} email={auth.user.email}>
      {children}
    </AdminShell>
  );
}
