"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { uploadDetailsSchema, splitCsv, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, type UploadDetailsInput } from "@/lib/validations/upload";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function uniqueSlug(base: string, supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const { count } = await supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("slug", slug);
    if (!count) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

export async function submitAsset(
  input: UploadDetailsInput,
): Promise<{ error?: string; resourceId?: string }> {
  // 1. AUTH
  const auth = await getAuthenticatedUser();
  if (!auth) return { error: "Sign in to upload." };

  // 2. VALIDATE
  const parsed = uploadDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  // 3. AUTHORIZE — must be a creator with a linked creator entity
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!creator) {
    return { error: "You must be an approved creator to upload assets." };
  }

  // Server-side file type validation (client MIME cannot be trusted).
  const allowedTypes = ALLOWED_MIME_TYPES as readonly string[];
  if (!allowedTypes.includes(data.file_type) && !data.file_type.startsWith("font/")) {
    return { error: "File type not allowed." };
  }
  if (data.file_size_bytes > MAX_FILE_SIZE_BYTES) {
    return { error: "File exceeds the 200 MB limit." };
  }

  // 4. EXECUTE — admin client (creator_id set from server, review_status server-decides)
  // Using admin client: creator INSERT RLS would need complex policy; simpler to validate
  // identity above and bypass RLS here (same pattern as onboarding + apply actions).
  const admin = createAdminClient();
  const autoApprove = env.CREATOR_AUTO_APPROVE;
  const slug = await uniqueSlug(slugify(data.title), admin);

  const { error: insertError } = await admin
    .from("resources")
    .insert({
      creator_id: creator.id,        // set server-side — never from client
      category_id: data.category_id,
      title: data.title,
      slug,
      description: data.description ?? null,
      tags: splitCsv(data.tags),
      compatible_software: splitCsv(data.compatible_software),
      file_path: data.file_path,
      file_name: data.file_name,
      file_size_bytes: data.file_size_bytes,
      file_type: data.file_type,
      preview_image_path: data.preview_image_path,
      preview_images: [data.preview_image_path],
      status: autoApprove ? "published" : "draft",
      review_status: autoApprove ? "approved" : "submitted",
      submitted_at: new Date().toISOString(),
      reviewed_at: autoApprove ? new Date().toISOString() : null,
      reviewed_by: null,
    })
    .select("id");

  if (insertError) {
    console.error("[submitAsset] insert failed", {
      message: insertError.message,
      code: insertError.code,
    });
    return { error: "Could not publish your asset. Please try again." };
  }

  redirect(`/resources/${slug}`);
}

export async function saveDraft(
  input: Partial<UploadDetailsInput> & { existing_id?: string },
): Promise<{ error?: string; resourceId?: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { error: "Sign in to save drafts." };

  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!creator) return { error: "Creator profile not found." };

  const admin = createAdminClient();

  if (input.existing_id) {
    // Update existing draft (verify ownership first)
    const { data: existing } = await admin
      .from("resources")
      .select("id, review_status")
      .eq("id", input.existing_id)
      .eq("creator_id", creator.id)
      .maybeSingle();

    if (!existing) return { error: "Draft not found." };
    if (existing.review_status !== "draft") return { error: "Only draft assets can be edited." };

    const { error } = await admin
      .from("resources")
      .update({
        title: input.title ?? "Untitled draft",
        description: input.description ?? null,
        category_id: input.category_id,
        tags: splitCsv(input.tags),
        compatible_software: splitCsv(input.compatible_software),
        file_path: input.file_path ?? "",
        file_name: input.file_name ?? "",
        file_size_bytes: input.file_size_bytes ?? 0,
        file_type: input.file_type ?? "",
        preview_image_path: input.preview_image_path ?? "",
        preview_images: input.preview_image_path ? [input.preview_image_path] : [],
      })
      .eq("id", input.existing_id);

    if (error) return { error: "Could not save draft." };
    return { resourceId: input.existing_id };
  } else {
    // Insert new draft
    const slug = await uniqueSlug(
      slugify(input.title ?? "untitled-draft"),
      admin,
    );
    const { data, error } = await admin
      .from("resources")
      .insert({
        creator_id: creator.id,
        category_id: input.category_id ?? "00000000-0000-0000-0000-000000000000",
        title: input.title ?? "Untitled draft",
        slug,
        description: input.description ?? null,
        tags: splitCsv(input.tags),
        compatible_software: splitCsv(input.compatible_software),
        file_path: input.file_path ?? "",
        file_name: input.file_name ?? "",
        file_size_bytes: input.file_size_bytes ?? 0,
        file_type: input.file_type ?? "",
        preview_image_path: input.preview_image_path ?? "",
        preview_images: [],
        status: "draft",
        review_status: "draft",
      })
      .select("id")
      .single();

    if (error) return { error: "Could not save draft." };
    return { resourceId: data.id };
  }
}
