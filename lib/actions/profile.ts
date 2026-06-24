"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(80, "Name too long"),
});

export type UpdateProfileState =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfile(
  _prev: UpdateProfileState | null,
  formData: FormData,
): Promise<UpdateProfileState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, error: "Not authenticated" };

  const parsed = updateProfileSchema.safeParse({
    full_name: formData.get("full_name"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, updated_at: new Date().toISOString() })
    .eq("id", auth.user.id);

  if (error) return { ok: false, error: "Failed to save profile." };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/overview");
  return { ok: true };
}

export async function updateAvatar(
  _prev: UpdateProfileState | null,
  formData: FormData,
): Promise<UpdateProfileState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, error: "Not authenticated" };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided" };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: "Only JPEG, PNG, WebP or GIF images are allowed." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: "Image must be under 2 MB." };
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${auth.user.id}/avatar.${ext}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { ok: false, error: "Upload failed. Please try again." };

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: dbError } = await supabase
    .from("profiles")
    .update({ avatar_path: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", auth.user.id);

  if (dbError) return { ok: false, error: "Failed to save avatar URL." };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/overview");
  return { ok: true };
}
