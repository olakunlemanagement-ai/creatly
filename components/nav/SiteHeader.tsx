import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { HeaderClient } from "@/components/nav/HeaderClient";
import type { Category } from "@/types/database";

export type NavCategory = Pick<Category, "id" | "name" | "slug"> & {
  children: Pick<Category, "id" | "name" | "slug">[];
};

export async function SiteHeader() {
  const supabase = await createClient();

  const [auth, { data: allCats }] = await Promise.all([
    getAuthenticatedUser(),
    supabase
      .from("categories")
      .select("id, name, slug, parent_id, level")
      .eq("is_active", true)
      .in("level", [1, 2])
      .order("sort_order")
      .returns<Pick<Category, "id" | "name" | "slug" | "parent_id" | "level">[]>(),
  ]);

  const cats = allCats ?? [];

  // Build level-1 categories with their level-2 children
  const rootMap = new Map<string, NavCategory>();
  for (const cat of cats) {
    if (cat.level === 1) {
      rootMap.set(cat.id, { id: cat.id, name: cat.name, slug: cat.slug, children: [] });
    }
  }
  for (const cat of cats) {
    if (cat.level === 2 && cat.parent_id) {
      rootMap.get(cat.parent_id)?.children.push({ id: cat.id, name: cat.name, slug: cat.slug });
    }
  }

  const navCategories: NavCategory[] = Array.from(rootMap.values());

  return (
    <HeaderClient
      auth={auth}
      navCategories={navCategories}
    />
  );
}
