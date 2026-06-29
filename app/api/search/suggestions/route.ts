import { z } from "zod";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api-response";

const querySchema = z.object({
  q: z
    .string()
    .min(2, "q must be at least 2 characters")
    .max(50, "q must be at most 50 characters")
    .transform((v) => v.trim()),
});

type ResourceSuggestion = {
  type: "resource";
  title: string;
  slug: string;
  category: string;
  preview_url: string | null;
};
type CategorySuggestion = { type: "category"; name: string; slug: string };
type TagSuggestion = { type: "tag"; tag: string };
export type Suggestion = ResourceSuggestion | CategorySuggestion | TagSuggestion;

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return fail("invalid_query", "q must be 2–50 characters", 400);
  }
  const { q } = parsed.data;

  const supabase = await createClient();

  const [{ data: resources }, { data: categories }, { data: tagResources }] =
    await Promise.all([
      // Top 4 resources matching title
      supabase
        .from("resources")
        .select("title, slug, preview_url, categories(name, slug)")
        .eq("status", "published")
        .ilike("title", `%${q}%`)
        .limit(4),

      // Top 2 level-1 categories matching name
      supabase
        .from("categories")
        .select("name, slug")
        .eq("is_active", true)
        .eq("level", 1)
        .ilike("name", `%${q}%`)
        .limit(2),

      // Resources with tags array that textually contains the query
      supabase
        .from("resources")
        .select("tags")
        .eq("status", "published")
        .filter("tags::text", "ilike", `%${q}%`)
        .not("tags", "is", null)
        .limit(20),
    ]);

  const suggestions: Suggestion[] = [];

  // Resource suggestions
  for (const r of resources ?? []) {
    // Supabase infers the join as an array; cast through unknown to the actual runtime shape
    const cat = (r.categories as unknown) as { name: string; slug: string } | null;
    suggestions.push({
      type: "resource",
      title: r.title as string,
      slug: r.slug as string,
      category: cat?.name ?? "",
      preview_url: (r.preview_url as string | null) ?? null,
    });
  }

  // Category suggestions
  for (const c of categories ?? []) {
    suggestions.push({ type: "category", name: c.name, slug: c.slug });
  }

  // Tag suggestions — extract unique tags that match query string
  const tagCounts = new Map<string, number>();
  const qLower = q.toLowerCase();
  for (const r of tagResources ?? []) {
    for (const tag of (r.tags as string[]) ?? []) {
      if (tag.toLowerCase().includes(qLower)) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  for (const [tag] of topTags) {
    suggestions.push({ type: "tag", tag });
  }

  return ok({ suggestions });
}
