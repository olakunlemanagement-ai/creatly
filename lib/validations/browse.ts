import { z } from "zod";

export const SORT_OPTIONS = ["newest", "popular", "featured"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  popular: "Most downloaded",
  featured: "Featured first",
};

export const browseParamsSchema = z.object({
  q: z
    .string()
    .max(100)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  category: z.string().max(100).optional(),
  sort: z.enum(SORT_OPTIONS).catch("newest"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type BrowseParams = z.infer<typeof browseParamsSchema>;
