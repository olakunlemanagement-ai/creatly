import { z } from "zod";

// Allowed MIME types for resource files
export const ALLOWED_MIME_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
  "font/otf",
  "font/ttf",
  "font/woff",
  "font/woff2",
  "application/vnd.ms-fontobject",
  "application/octet-stream", // fallback for font files with wrong MIME
] as const;

// 5 GB cap — matches the Supabase Pro plan storage object limit.
// Files above 100 MB should use TUS resumable upload (see UploadWizard).
// Supabase Free plan hard limit is 50 MB per object; upgrade to Pro is required.
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
export const MAX_PREVIEW_SIZE_BYTES = 5 * 1024 * 1024;  // 5 MB
export const TUS_THRESHOLD_BYTES = 100 * 1024 * 1024; // 100 MB — use TUS above this

export const uploadDetailsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(1000).optional(),
  category_id: z.string().uuid("Please select a category"),
  tags: z.string().max(200).optional(),
  compatible_software: z.string().max(200).optional(),
  // File metadata — validated on server after upload
  file_path: z.string().min(1, "Please upload a file"),
  file_name: z.string().min(1),
  file_size_bytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  file_type: z.string().min(1),
  preview_image_path: z.string().min(1, "Please upload a preview image"),
});

export type UploadDetailsInput = z.infer<typeof uploadDetailsSchema>;

export function splitCsv(value: string | undefined | null): string[] {
  if (!value) return [];
  return value.split(",").map((t) => t.trim()).filter(Boolean);
}

export const editAssetSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(1000).optional(),
  category_id: z.string().uuid("Please select a category"),
  tags: z.string().max(200).optional(),
  compatible_software: z.string().max(200).optional(),
});

export type EditAssetInput = z.infer<typeof editAssetSchema>;
