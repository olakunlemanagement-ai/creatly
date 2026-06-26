"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { editAssetSchema, splitCsv, type EditAssetInput } from "@/lib/validations/upload";

export async function updateAsset(
  id: string,
  input: EditAssetInput,
): Promise<{ error?: string }> {
  // 1. AUTH
  const auth = await getAuthenticatedUser();
  if (!auth) return { error: "Sign in to edit assets." };

  // 2. VALIDATE
  const parsed = editAssetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  // 3. AUTHORIZE — ownership verified server-side; admin client bypasses RLS (resources are creator-insert only via admin)
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!creator) return { error: "Creator profile not found." };

  const admin = createAdminClient();
  const { data: asset } = await admin
    .from("resources")
    .select("id, review_status, status")
    .eq("id", id)
    .eq("creator_id", creator.id)
    .maybeSingle();

  if (!asset) return { error: "Asset not found or you do not own it." };

  // 4. EXECUTE — compute review/status transitions for published assets
  const autoApprove = env.CREATOR_AUTO_APPROVE;
  const isPublished = asset.review_status === "approved";

  const reviewFields: Record<string, string | null> = {};
  if (isPublished) {
    if (autoApprove) {
      reviewFields.review_status = "approved";
      reviewFields.status = "published";
      reviewFields.reviewed_at = new Date().toISOString();
    } else {
      // Send back for re-review
      reviewFields.review_status = "submitted";
      reviewFields.status = "draft";
      reviewFields.submitted_at = new Date().toISOString();
      reviewFields.reviewed_at = null;
    }
  }

  const { error: updateError } = await admin
    .from("resources")
    .update({
      title: data.title,
      description: data.description ?? null,
      category_id: data.category_id,
      tags: splitCsv(data.tags),
      compatible_software: splitCsv(data.compatible_software),
      ...reviewFields,
    })
    .eq("id", id);

  if (updateError) {
    console.error("[updateAsset] update failed", updateError.message);
    return { error: "Could not update asset. Please try again." };
  }

  redirect("/creator/assets?updated=1");
}

export async function deleteAsset(id: string): Promise<{ error?: string }> {
  // 1. AUTH
  const auth = await getAuthenticatedUser();
  if (!auth) return { error: "Sign in to delete assets." };

  // 2. AUTHORIZE — must own asset and it must be a draft
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!creator) return { error: "Creator profile not found." };

  const admin = createAdminClient();
  const { data: asset } = await admin
    .from("resources")
    .select("id, review_status")
    .eq("id", id)
    .eq("creator_id", creator.id)
    .maybeSingle();

  if (!asset) return { error: "Asset not found or you do not own it." };
  if (asset.review_status !== "draft") return { error: "Only draft assets can be deleted." };

  // 3. EXECUTE
  const { error: deleteError } = await admin
    .from("resources")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("[deleteAsset] delete failed", deleteError.message);
    return { error: "Could not delete asset. Please try again." };
  }

  redirect("/creator/assets?deleted=1");
}
