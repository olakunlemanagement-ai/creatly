import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Fetches the permissions array for a user from their admin_team row.
// React cache() memoises per-request so multiple hasPermission() calls
// in one render/action only hit the DB once per userId.
const getAdminPermissions = cache(async (userId: string): Promise<string[]> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("admin_team")
    .select("admin_roles(permissions)")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return [];
  const role = data.admin_roles as unknown as { permissions: string[] } | null;
  return role?.permissions ?? [];
});

// True if the user holds the given permission OR the wildcard '*' (super_admin).
export async function hasPermission(
  userId: string,
  permission: string,
): Promise<boolean> {
  const permissions = await getAdminPermissions(userId);
  return permissions.includes("*") || permissions.includes(permission);
}

// True if the user is in admin_team at all (any role).
// Used for /admin/overview — any valid admin_team member may enter.
export async function isAdminTeamMember(userId: string): Promise<boolean> {
  const permissions = await getAdminPermissions(userId);
  return permissions.length > 0;
}
