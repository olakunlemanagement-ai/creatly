"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveResourceSchema, rejectResourceSchema } from "@/lib/validations/admin";

// Shared guard: confirms the caller is authenticated and has the 'admin' role.
// Returns the admin user ID or an error string.
async function requireAdmin(): Promise<{ adminId: string } | { error: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { error: "Not authenticated." };
  if (auth.profile.role !== "admin") return { error: "Forbidden." };
  return { adminId: auth.user.id };
}

// approveResource — sets review_status='approved', status='published'.
// Uses admin client: RLS blocks non-admin resource updates.
// Identity is verified above before admin client touches the DB.
export async function approveResource(
  resourceId: string,
): Promise<{ error?: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return { error: guard.error };

  const parsed = approveResourceSchema.safeParse({ resourceId });
  if (!parsed.success) return { error: "Invalid resource ID." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("resources")
    .update({
      review_status: "approved",
      status: "published",
      reviewed_at: new Date().toISOString(),
      reviewed_by: guard.adminId,
      rejection_reason: null,
    })
    .eq("id", parsed.data.resourceId)
    .eq("review_status", "submitted"); // guard: only submitted assets can be approved

  if (error) {
    console.error("[approveResource] failed", { message: error.message, resourceId });
    return { error: "Could not approve this asset. Please try again." };
  }

  revalidatePath("/admin/review");
  return {};
}

// rejectResource — sets review_status='rejected' with a mandatory reason.
// Creator will see the reason in Studio and can resubmit after addressing it.
// Uses admin client: RLS blocks non-admin resource updates.
// Identity is verified above before admin client touches the DB.
export async function rejectResource(
  resourceId: string,
  reason: string,
): Promise<{ error?: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return { error: guard.error };

  const parsed = rejectResourceSchema.safeParse({ resourceId, reason });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("resources")
    .update({
      review_status: "rejected",
      status: "draft",
      reviewed_at: new Date().toISOString(),
      reviewed_by: guard.adminId,
      rejection_reason: parsed.data.reason,
    })
    .eq("id", parsed.data.resourceId)
    .eq("review_status", "submitted"); // guard: only submitted assets can be rejected

  if (error) {
    console.error("[rejectResource] failed", { message: error.message, resourceId });
    return { error: "Could not reject this asset. Please try again." };
  }

  revalidatePath("/admin/review");
  return {};
}
