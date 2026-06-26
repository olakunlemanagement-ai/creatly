"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_NAME, APP_URL } from "@/lib/config";
import {
  approveResourceSchema,
  rejectResourceSchema,
  createCreatorSchema,
  updateCreatorSchema,
  createCategorySchema,
  updateCategorySchema,
  type CreateCreatorInput,
  type UpdateCreatorInput,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/lib/validations/admin";

// ─── Permission guards ─────────────────────────────────────────────────────
//
// requirePermission(p) — caller must be authenticated AND hold permission p
//   in their admin_team role (or the wildcard '*').
//
// requireSuperAdmin() — caller must hold '*' (only super_admin role has this).

async function requirePermission(
  permission: string,
): Promise<{ adminId: string } | { error: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { error: "Not authenticated." };

  const allowed = await hasPermission(auth.user.id, permission);
  if (!allowed) return { error: "Forbidden." };

  return { adminId: auth.user.id };
}

async function requireSuperAdmin(): Promise<
  { adminId: string; adminEmail: string } | { error: string }
> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { error: "Not authenticated." };

  // super_admin is the only role with wildcard permission '*'
  const allowed = await hasPermission(auth.user.id, "*");
  if (!allowed) return { error: "Forbidden." };

  return { adminId: auth.user.id, adminEmail: auth.user.email };
}

// ─── Review queue ──────────────────────────────────────────────────────────

export async function approveResource(
  resourceId: string,
): Promise<{ error?: string }> {
  const guard = await requirePermission("review_queue.write");
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
    .eq("review_status", "submitted");

  if (error) {
    console.error("[approveResource] failed", { message: error.message, resourceId });
    return { error: "Could not approve this asset. Please try again." };
  }

  revalidatePath("/admin/review");
  return {};
}

export async function rejectResource(
  resourceId: string,
  reason: string,
): Promise<{ error?: string }> {
  const guard = await requirePermission("review_queue.write");
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
    .eq("review_status", "submitted");

  if (error) {
    console.error("[rejectResource] failed", { message: error.message, resourceId });
    return { error: "Could not reject this asset. Please try again." };
  }

  revalidatePath("/admin/review");
  return {};
}

// ─── Creator CRUD ──────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createCreator(
  data: CreateCreatorInput,
  avatarFormData?: FormData,
): Promise<{ error?: string; id?: string }> {
  const guard = await requirePermission("creators.write");
  if ("error" in guard) return { error: guard.error };

  const parsed = createCreatorSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input." };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("creators")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (existing) return { error: "A creator with this slug already exists." };

  let avatarPath: string | null = null;
  if (avatarFormData) {
    const file = avatarFormData.get("avatar") as File | null;
    if (file && file.size > 0) {
      const ext = file.type.split("/")[1] ?? "jpg";
      const uploadPath = `creators/${slugify(parsed.data.name)}/avatar.${ext}`;
      const { error: storageError } = await admin.storage
        .from("creator-avatars")
        .upload(uploadPath, file, { upsert: true });
      if (!storageError) avatarPath = uploadPath;
    }
  }

  const { data: creator, error } = await admin
    .from("creators")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      bio: parsed.data.bio ?? null,
      website_url: parsed.data.website_url || null,
      is_public: parsed.data.is_public ?? true,
      avatar_path: avatarPath,
      is_verified: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createCreator] failed", { message: error.message });
    return { error: "Could not create creator. Please try again." };
  }

  revalidatePath("/admin/creators");
  return { id: creator.id };
}

export async function updateCreator(
  data: UpdateCreatorInput,
  avatarFormData?: FormData,
): Promise<{ error?: string }> {
  const guard = await requirePermission("creators.write");
  if ("error" in guard) return { error: guard.error };

  const parsed = updateCreatorSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input." };

  const { id, ...fields } = parsed.data;
  const admin = createAdminClient();

  if (fields.slug) {
    const { data: existing } = await admin
      .from("creators")
      .select("id")
      .eq("slug", fields.slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) return { error: "A creator with this slug already exists." };
  }

  let avatarPath: string | undefined;
  if (avatarFormData) {
    const file = avatarFormData.get("avatar") as File | null;
    if (file && file.size > 0) {
      const ext = file.type.split("/")[1] ?? "jpg";
      const uploadPath = `creators/${id}/avatar.${ext}`;
      const { error: storageError } = await admin.storage
        .from("creator-avatars")
        .upload(uploadPath, file, { upsert: true });
      if (!storageError) avatarPath = uploadPath;
    }
  }

  const updatePayload: Record<string, unknown> = {
    ...fields,
    website_url: fields.website_url || null,
    bio: fields.bio ?? null,
    updated_at: new Date().toISOString(),
  };
  if (avatarPath !== undefined) updatePayload.avatar_path = avatarPath;

  const { error } = await admin
    .from("creators")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("[updateCreator] failed", { message: error.message });
    return { error: "Could not update creator. Please try again." };
  }

  revalidatePath("/admin/creators");
  revalidatePath(`/admin/creators/${id}/edit`);
  return {};
}

// Soft-delete: set is_public = false so creator is hidden but resources still reference them.
export async function softDeleteCreator(id: string): Promise<{ error?: string }> {
  const guard = await requirePermission("creators.write");
  if ("error" in guard) return { error: guard.error };

  if (!id) return { error: "Invalid ID." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("creators")
    .update({ is_public: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[softDeleteCreator] failed", { message: error.message });
    return { error: "Could not deactivate creator. Please try again." };
  }

  revalidatePath("/admin/creators");
  return {};
}

// ─── Category CRUD ─────────────────────────────────────────────────────────

export async function createCategory(
  data: CreateCategoryInput,
): Promise<{ error?: string; id?: string }> {
  const guard = await requirePermission("categories.write");
  if ("error" in guard) return { error: guard.error };

  const parsed = createCategorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input." };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("categories")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (existing) return { error: "A category with this slug already exists." };

  const { data: cat, error } = await admin
    .from("categories")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      is_active: parsed.data.is_active ?? true,
      sort_order: parsed.data.sort_order ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createCategory] failed", { message: error.message });
    return { error: "Could not create category. Please try again." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/browse");
  return { id: cat.id };
}

export async function updateCategory(
  data: UpdateCategoryInput,
): Promise<{ error?: string }> {
  const guard = await requirePermission("categories.write");
  if ("error" in guard) return { error: guard.error };

  const parsed = updateCategorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input." };

  const { id, ...fields } = parsed.data;
  const admin = createAdminClient();

  if (fields.slug) {
    const { data: existing } = await admin
      .from("categories")
      .select("id")
      .eq("slug", fields.slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) return { error: "A category with this slug already exists." };
  }

  const { error } = await admin
    .from("categories")
    .update({ ...fields, description: fields.description ?? null })
    .eq("id", id);

  if (error) {
    console.error("[updateCategory] failed", { message: error.message });
    return { error: "Could not update category. Please try again." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/browse");
  return {};
}

export async function moveCategoryOrder(
  id: string,
  direction: "up" | "down",
): Promise<{ error?: string }> {
  const guard = await requirePermission("categories.write");
  if ("error" in guard) return { error: guard.error };

  const admin = createAdminClient();

  const { data: cats } = await admin
    .from("categories")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (!cats) return { error: "Could not load categories." };

  const idx = cats.findIndex((c) => c.id === id);
  if (idx === -1) return { error: "Category not found." };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= cats.length) return {};

  const current = cats[idx];
  const swap = cats[swapIdx];
  if (!current || !swap) return {};

  await Promise.all([
    admin.from("categories").update({ sort_order: swap.sort_order }).eq("id", current.id),
    admin.from("categories").update({ sort_order: current.sort_order }).eq("id", swap.id),
  ]);

  revalidatePath("/admin/categories");
  revalidatePath("/browse");
  return {};
}

// ─── Admin team management (super_admin only) ──────────────────────────────

const inviteAdminSchema = z.object({
  email:  z.string().email("Enter a valid email address."),
  roleId: z.string().uuid("Invalid role ID."),
});

export async function inviteAdmin(
  email: string,
  roleId: string,
): Promise<{ error?: string }> {
  const guard = await requireSuperAdmin();
  if ("error" in guard) return { error: guard.error };

  const parsed = inviteAdminSchema.safeParse({ email, roleId });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input." };

  const admin = createAdminClient();

  // Reject if this email already holds an admin-level role
  const { data: existing } = await admin
    .from("profiles")
    .select("role")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (existing && (existing.role === "admin" || existing.role === "super_admin")) {
    return { error: "That user is already an admin." };
  }

  // Resolve the role label for the invite email
  const { data: role } = await admin
    .from("admin_roles")
    .select("id, label, name")
    .eq("id", parsed.data.roleId)
    .maybeSingle();

  if (!role) return { error: "Invalid role selected." };
  // Protect against inviting someone directly to super_admin via the UI
  if (role.name === "super_admin") return { error: "Cannot invite to super_admin via this form." };

  const token = randomBytes(32).toString("hex");

  const { error: insertError } = await admin
    .from("admin_invites")
    .insert({
      email: parsed.data.email,
      token,
      invited_by: guard.adminId,
      role_id: parsed.data.roleId,
    });

  if (insertError) {
    console.error("[inviteAdmin] insert error:", insertError);
    return { error: "Could not create invite. Please try again." };
  }

  const acceptUrl = `${APP_URL}/accept-admin-invite?token=${token}`;
  await sendAdminInviteEmail({
    to: parsed.data.email,
    fromEmail: guard.adminEmail,
    roleLabel: role.label,
    acceptUrl,
  });

  revalidatePath("/admin/team");
  return {};
}

async function sendAdminInviteEmail(opts: {
  to: string;
  fromEmail: string;
  roleLabel: string;
  acceptUrl: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[inviteAdmin] RESEND_API_KEY not set — invite URL:", opts.acceptUrl);
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${APP_NAME} <noreply@joincreatly.com>`,
        to: opts.to,
        subject: `You've been invited to join ${APP_NAME} as ${opts.roleLabel}`,
        html: `
          <p>${opts.fromEmail} has invited you to become a <strong>${opts.roleLabel}</strong> on ${APP_NAME}.</p>
          <p>
            <a href="${opts.acceptUrl}"
               style="background:#1a3d2f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
              Accept invite
            </a>
          </p>
          <p style="color:#888;font-size:12px;">
            This invite expires in 7 days. If you didn't expect this, ignore it safely.
          </p>
        `,
      }),
    });
  } catch (err) {
    console.error("[inviteAdmin] email error:", err);
  }
}

const removeAdminSchema = z.object({
  userId: z.string().uuid("Invalid user ID."),
});

export async function removeAdmin(userId: string): Promise<{ error?: string }> {
  const guard = await requireSuperAdmin();
  if ("error" in guard) return { error: guard.error };

  const parsed = removeAdminSchema.safeParse({ userId });
  if (!parsed.success) return { error: "Invalid user ID." };

  const admin = createAdminClient();

  // Fetch their admin_team row to check their role before removal
  const { data: teamRow } = await admin
    .from("admin_team")
    .select("id, admin_roles(name)")
    .eq("user_id", parsed.data.userId)
    .maybeSingle();

  if (!teamRow) return { error: "User is not in the admin team." };

  const roleName = (teamRow.admin_roles as unknown as { name: string } | null)?.name;
  if (roleName === "super_admin") return { error: "Cannot remove a super admin." };

  // Delete admin_team row, then demote profile role
  const { error: deleteError } = await admin
    .from("admin_team")
    .delete()
    .eq("user_id", parsed.data.userId);

  if (deleteError) {
    console.error("[removeAdmin] delete error:", deleteError);
    return { error: "Could not remove admin. Please try again." };
  }

  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "user", updated_at: new Date().toISOString() })
    .eq("id", parsed.data.userId);

  if (roleError) {
    console.error("[removeAdmin] role update error:", roleError);
    return { error: "Removed from team but could not demote role. Contact support." };
  }

  revalidatePath("/admin/team");
  return {};
}

const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

// Called from the accept-invite page after the user is authenticated.
// Uses admin client because the caller is not yet an admin.
export async function acceptAdminInvite(token: string): Promise<{ error?: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { error: "You must be signed in to accept this invite." };

  const parsed = acceptInviteSchema.safeParse({ token });
  if (!parsed.success) return { error: "Invalid invite token." };

  const adminDb = createAdminClient();

  const { data: invite } = await adminDb
    .from("admin_invites")
    .select("id, email, expires_at, used_at, role_id")
    .eq("token", parsed.data.token)
    .maybeSingle();

  if (!invite) return { error: "Invite not found or already used." };
  if (invite.used_at) return { error: "This invite has already been used." };
  if (new Date(invite.expires_at) < new Date()) return { error: "This invite has expired." };
  if (invite.email.toLowerCase() !== auth.user.email.toLowerCase()) {
    return { error: `This invite was sent to ${invite.email}. Sign in with that address.` };
  }

  // Resolve the assigned role (null role_id falls back to the legacy plain 'admin' path)
  let roleName: string | null = null;
  let roleId: string | null = invite.role_id ?? null;

  if (roleId) {
    const { data: role } = await adminDb
      .from("admin_roles")
      .select("id, name")
      .eq("id", roleId)
      .maybeSingle();
    if (role) roleName = role.name;
    else roleId = null; // role deleted after invite was issued
  }

  // Mark token consumed before making any changes (prevents double-use on retry)
  await adminDb
    .from("admin_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Set profiles.role:
  //   super_admin role → 'super_admin' (so middleware fast-guard keeps working)
  //   everything else  → 'admin'
  const profileRole = roleName === "super_admin" ? "super_admin" : "admin";

  const { error: roleError } = await adminDb
    .from("profiles")
    .update({ role: profileRole, updated_at: new Date().toISOString() })
    .eq("id", auth.user.id);

  if (roleError) {
    console.error("[acceptAdminInvite] role update error:", roleError);
    return { error: "Could not activate your admin account. Contact the team." };
  }

  // Insert into admin_team if a role is attached to the invite
  if (roleId) {
    const { error: teamError } = await adminDb
      .from("admin_team")
      .insert({ user_id: auth.user.id, role_id: roleId });

    if (teamError) {
      // Non-fatal if row already exists (idempotent re-accept guard)
      if (!teamError.message.includes("duplicate")) {
        console.error("[acceptAdminInvite] admin_team insert error:", teamError);
      }
    }
  }

  return {};
}
