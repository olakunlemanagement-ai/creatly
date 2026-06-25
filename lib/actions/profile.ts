"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(80, "Name too long"),
});

const VALID_GENDERS = ["male", "female", "prefer_not_to_say"] as const;

const updateProfileExtendedSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(80, "Name too long").optional(),
  gender: z.enum(VALID_GENDERS).nullable().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").nullable().optional(),
  phone_number: z.string().max(30, "Phone number too long").nullable().optional(),
  language: z.string().min(2).max(10).optional(),
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

export async function updateProfileExtended(
  _prev: UpdateProfileState | null,
  formData: FormData,
): Promise<UpdateProfileState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, error: "Not authenticated" };

  // Combine first + last name inputs into a single full_name value
  const firstName = (formData.get("first_name") as string | null)?.trim() ?? "";
  const lastName = (formData.get("last_name") as string | null)?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || undefined;

  const rawGender = formData.get("gender");
  const parsed = updateProfileExtendedSchema.safeParse({
    full_name: fullName,
    gender: rawGender === "" || rawGender === null ? null : rawGender,
    date_of_birth: (formData.get("date_of_birth") as string | null) || null,
    phone_number: (formData.get("phone_number") as string | null) || null,
    language: (formData.get("language") as string | null) ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", auth.user.id);

  if (error) return { ok: false, error: "Failed to save profile." };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard/overview");
  return { ok: true };
}
