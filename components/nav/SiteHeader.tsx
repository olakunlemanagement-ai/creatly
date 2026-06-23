import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { HeaderClient } from "@/components/nav/HeaderClient";
import type { Category } from "@/types/database";

interface SiteHeaderProps {
  /** When false the header always shows as solid (e.g. on inner pages without a hero). */
  transparent?: boolean;
}

export async function SiteHeader({ transparent = true }: SiteHeaderProps) {
  const supabase = await createClient();

  const [auth, { data: categories }] = await Promise.all([
    getAuthenticatedUser(),
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order")
      .returns<Pick<Category, "id" | "name" | "slug">[]>(),
  ]);

  return (
    <HeaderClient
      auth={auth}
      categories={categories ?? []}
      transparent={transparent}
    />
  );
}
