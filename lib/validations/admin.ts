import { z } from "zod";

export const approveResourceSchema = z.object({
  resourceId: z.string().uuid(),
});

export const rejectResourceSchema = z.object({
  resourceId: z.string().uuid(),
  reason: z.string().min(10, "Rejection reason must be at least 10 characters").max(500),
});

// ── Slug pattern (shared) ─────────────────────────────────
const slugPattern = /^[a-z0-9-]+$/;

// ── Creator ──────────────────────────────────────────────

export const createCreatorSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(slugPattern, "Slug may only contain lowercase letters, numbers, and hyphens"),
  bio: z.string().max(500).optional(),
  website_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  is_public: z.boolean(),
});
export type CreateCreatorInput = z.infer<typeof createCreatorSchema>;

export const updateCreatorSchema = createCreatorSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateCreatorInput = z.infer<typeof updateCreatorSchema>;

// ── Category ─────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(slugPattern, "Slug may only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(300).optional(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ── Admin resource upload ────────────────────────────────

export const COMPATIBLE_SOFTWARE_OPTIONS = [
  "Figma",
  "Canva",
  "Adobe Illustrator",
  "After Effects",
  "PowerPoint",
  "Other",
] as const;

export const adminUploadDetailsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(1000).optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  category_id: z.string().uuid("Please select a category"),
  creator_id: z.string().uuid("Please select a creator"),
  tags: z.string().max(200).optional(),
  compatible_software: z.string().max(200).optional(),
  is_featured: z.boolean(),
  status: z.enum(["draft", "published"]),
});
export type AdminUploadDetailsInput = z.infer<typeof adminUploadDetailsSchema>;
