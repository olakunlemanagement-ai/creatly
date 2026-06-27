"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminUploadDetailsSchema,
} from "@/lib/validations/admin";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_PREVIEW_SIZE_BYTES,
  splitCsv,
} from "@/lib/validations/upload";

async function requireResourceWrite(): Promise<{ adminId: string } | { error: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { error: "Not authenticated." };
  const allowed = await hasPermission(auth.user.id, "resources.write");
  if (!allowed) return { error: "Forbidden." };
  return { adminId: auth.user.id };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function uniqueSlug(
  base: string,
  admin: ReturnType<typeof createAdminClient>,
  excludeId?: string,
): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const query = admin
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("slug", slug);
    if (excludeId) query.neq("id", excludeId);
    const { count } = await query;
    if (!count) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

// Single server action that receives FormData with files + metadata.
// Files are uploaded to storage; then resource row is inserted.
// creator_id is set from the admin-provided value (server-verified), never from a client-trusted field.
export async function adminCreateResource(
  formData: FormData,
): Promise<{ error?: string; slug?: string }> {
  // 1. AUTH + ROLE
  const guard = await requireResourceWrite();
  if ("error" in guard) return { error: guard.error };

  // 2. VALIDATE metadata
  const rawDetails = {
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim() || undefined,
    slug: (formData.get("slug") as string)?.trim(),
    category_id: formData.get("category_id") as string,
    creator_id: formData.get("creator_id") as string,
    tags: (formData.get("tags") as string)?.trim() || undefined,
    compatible_software: (formData.get("compatible_software") as string)?.trim() || undefined,
    is_featured: formData.get("is_featured") === "true",
    status: formData.get("status") as "draft" | "published",
  };
  const parsed = adminUploadDetailsSchema.safeParse(rawDetails);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }
  const details = parsed.data;

  // 3. VALIDATE files server-side (client MIME cannot be trusted)
  const sourceFile = formData.get("source_file") as File | null;
  if (!sourceFile || sourceFile.size === 0) return { error: "Source file is required." };
  if (sourceFile.size > MAX_FILE_SIZE_BYTES) return { error: "Source file exceeds 200 MB limit." };
  const allowedTypes = ALLOWED_MIME_TYPES as readonly string[];
  if (!allowedTypes.includes(sourceFile.type) && !sourceFile.type.startsWith("font/")) {
    return { error: `File type '${sourceFile.type}' is not allowed.` };
  }

  const previewFile = formData.get("preview_file") as File | null;
  if (!previewFile || previewFile.size === 0) return { error: "Preview image is required." };
  if (previewFile.size > MAX_PREVIEW_SIZE_BYTES) return { error: "Preview image exceeds 5 MB limit." };
  if (!previewFile.type.startsWith("image/")) return { error: "Preview must be an image file." };

  // 4. EXECUTE — admin client (RLS bypassed; identity verified above)
  // Using admin client: resource INSERT needs to bypass creator-only RLS policies.
  // Identity and role verified via requireAdmin() before this point.
  const admin = createAdminClient();
  const resourceId = crypto.randomUUID();

  // Ensure slug is unique
  const baseSlug = details.slug || slugify(details.title);
  const finalSlug = await uniqueSlug(baseSlug, admin);

  // Upload source file to private bucket
  const sourcePath = `${resourceId}/${sourceFile.name}`;
  const { error: sourceError } = await admin.storage
    .from("resource-files")
    .upload(sourcePath, sourceFile, { upsert: false });
  if (sourceError) {
    console.error("[adminCreateResource] source upload failed", { message: sourceError.message });
    return { error: "Failed to upload source file. Please try again." };
  }

  // Upload preview image to public bucket
  const previewPath = `${resourceId}/${previewFile.name}`;
  const { error: previewError } = await admin.storage
    .from("resource-previews")
    .upload(previewPath, previewFile, { upsert: false });
  if (previewError) {
    await admin.storage.from("resource-files").remove([sourcePath]);
    console.error("[adminCreateResource] preview upload failed", { message: previewError.message });
    return { error: "Failed to upload preview image. Please try again." };
  }

  const isPublished = details.status === "published";
  const now = new Date().toISOString();

  const { error: insertError } = await admin.from("resources").insert({
    id: resourceId,
    creator_id: details.creator_id, // set from admin selection, never client-trusted
    category_id: details.category_id,
    title: details.title,
    slug: finalSlug,
    description: details.description ?? null,
    tags: splitCsv(details.tags),
    compatible_software: splitCsv(details.compatible_software),
    file_path: sourcePath,
    file_name: sourceFile.name,
    file_size_bytes: sourceFile.size,
    file_type: sourceFile.type,
    preview_image_path: previewPath,
    preview_images: [previewPath],
    is_featured: details.is_featured,
    status: details.status,
    review_status: isPublished ? "approved" : "draft",
    submitted_at: now,
    reviewed_at: isPublished ? now : null,
    reviewed_by: isPublished ? guard.adminId : null,
  });

  if (insertError) {
    // Roll back storage uploads so we don't leave orphaned files
    await Promise.all([
      admin.storage.from("resource-files").remove([sourcePath]),
      admin.storage.from("resource-previews").remove([previewPath]),
    ]);
    console.error("[adminCreateResource] insert failed", { message: insertError.message });
    return { error: "Could not create resource. Please try again." };
  }

  revalidatePath("/backstage-cl-hq-manage-9x3kp2/resources");
  revalidatePath("/browse");
  return { slug: finalSlug };
}

// Update resource metadata (used in 4.5 edit page)
export async function adminUpdateResource(
  id: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const guard = await requireResourceWrite();
  if ("error" in guard) return { error: guard.error };

  const rawDetails = {
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim() || undefined,
    slug: (formData.get("slug") as string)?.trim(),
    category_id: formData.get("category_id") as string,
    creator_id: formData.get("creator_id") as string,
    tags: (formData.get("tags") as string)?.trim() || undefined,
    compatible_software: (formData.get("compatible_software") as string)?.trim() || undefined,
    is_featured: formData.get("is_featured") === "true",
    status: formData.get("status") as "draft" | "published",
  };
  const parsed = adminUploadDetailsSchema.safeParse(rawDetails);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }
  const details = parsed.data;

  const admin = createAdminClient();

  // Verify slug uniqueness (excluding current resource)
  const baseSlug = details.slug || slugify(details.title);
  const finalSlug = await uniqueSlug(baseSlug, admin, id);

  const isPublished = details.status === "published";
  const now = new Date().toISOString();

  const { error } = await admin
    .from("resources")
    .update({
      creator_id: details.creator_id,
      category_id: details.category_id,
      title: details.title,
      slug: finalSlug,
      description: details.description ?? null,
      tags: splitCsv(details.tags),
      compatible_software: splitCsv(details.compatible_software),
      is_featured: details.is_featured,
      status: details.status,
      review_status: isPublished ? "approved" : "draft",
      reviewed_at: isPublished ? now : null,
      reviewed_by: isPublished ? guard.adminId : null,
      updated_at: now,
    })
    .eq("id", id);

  if (error) {
    console.error("[adminUpdateResource] failed", { message: error.message });
    return { error: "Could not update resource. Please try again." };
  }

  revalidatePath("/backstage-cl-hq-manage-9x3kp2/resources");
  revalidatePath(`/backstage-cl-hq-manage-9x3kp2/resources/${id}/edit`);
  revalidatePath("/browse");
  return {};
}

// Toggle is_featured inline
export async function adminToggleFeatured(
  id: string,
  isFeatured: boolean,
): Promise<{ error?: string }> {
  const guard = await requireResourceWrite();
  if ("error" in guard) return { error: guard.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("resources")
    .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "Could not update featured status." };
  revalidatePath("/backstage-cl-hq-manage-9x3kp2/resources");
  revalidatePath("/browse");
  return {};
}

// Toggle status published/draft inline
export async function adminToggleStatus(
  id: string,
  status: "published" | "draft",
): Promise<{ error?: string }> {
  const guard = await requireResourceWrite();
  if ("error" in guard) return { error: guard.error };

  const admin = createAdminClient();
  const isPublished = status === "published";
  const now = new Date().toISOString();

  const { error } = await admin
    .from("resources")
    .update({
      status,
      review_status: isPublished ? "approved" : "draft",
      reviewed_at: isPublished ? now : null,
      reviewed_by: isPublished ? guard.adminId : null,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return { error: "Could not update status." };
  revalidatePath("/backstage-cl-hq-manage-9x3kp2/resources");
  revalidatePath("/browse");
  return {};
}

// Soft-delete: set status='archived'
export async function adminArchiveResource(id: string): Promise<{ error?: string }> {
  const guard = await requireResourceWrite();
  if ("error" in guard) return { error: guard.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("resources")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "Could not archive resource." };
  revalidatePath("/backstage-cl-hq-manage-9x3kp2/resources");
  revalidatePath("/browse");
  return {};
}
