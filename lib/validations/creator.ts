import { z } from "zod";

export const applyAsCreatorSchema = z.object({
  handle: z
    .string()
    .min(3, "Handle must be at least 3 characters")
    .max(30, "Handle must be 30 characters or fewer")
    .regex(/^[a-z0-9_]+$/, "Handle can only contain lowercase letters, numbers, and underscores"),
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(80, "Display name must be 80 characters or fewer"),
  bio: z.string().max(500, "Bio must be 500 characters or fewer").optional(),
  location: z.string().max(100).optional(),
  website: z
    .string()
    .url("Please enter a valid URL")
    .max(255)
    .optional()
    .or(z.literal("")),
  agree_to_terms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the creator terms" }),
  }),
});

export type ApplyAsCreatorInput = z.infer<typeof applyAsCreatorSchema>;

export const updateCreatorProfileSchema = z.object({
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(80),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url("Please enter a valid URL").max(255).optional().or(z.literal("")),
});

export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>;
