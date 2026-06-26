import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

// Always render dynamically — role is fetched from the profiles table on every
// request and must never be served from a cached layout snapshot.
export const dynamic = "force-dynamic";

// All routes under (admin) require authentication AND admin role.
// The middleware enforces both; this layout is a second line of defence.
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
