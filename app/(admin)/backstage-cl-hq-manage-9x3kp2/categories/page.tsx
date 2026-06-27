import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { CategoryOrderButtons } from "@/components/admin/CategoryOrderButtons";
import { ToggleCategoryButton } from "@/components/admin/ToggleCategoryButton";

export const metadata: Metadata = {
  title: `Categories — ${APP_NAME} Admin`,
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description, is_active, sort_order, created_at")
    .order("sort_order", { ascending: true });

  // Resource counts per category
  type CatId = { category_id: string };
  const catIds = (categories ?? []).map((c) => c.id);
  let resourceCountMap = new Map<string, number>();
  if (catIds.length > 0) {
    const { data: resCounts } = await supabase
      .from("resources")
      .select("category_id")
      .in("category_id", catIds)
      .eq("status", "published")
      .returns<CatId[]>();
    const counts = (resCounts ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.category_id] = (acc[r.category_id] ?? 0) + 1;
      return acc;
    }, {});
    resourceCountMap = new Map(Object.entries(counts));
  }

  const cats = categories ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Categories</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {cats.length} total · drag to reorder using the arrows
          </p>
        </div>
        <Link
          href="/backstage-cl-hq-manage-9x3kp2/categories/new"
          className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New category
        </Link>
      </div>

      {cats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">No categories yet.</p>
          <Link href="/backstage-cl-hq-manage-9x3kp2/categories/new" className="mt-2 inline-block text-sm font-medium text-brand-green-700 hover:underline">
            Add the first category
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Resources
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cats.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <CategoryOrderButtons
                        id={cat.id}
                        isFirst={idx === 0}
                        isLast={idx === cats.length - 1}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{cat.name}</p>
                      {cat.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-xs">
                          {cat.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {cat.slug}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {resourceCountMap.get(cat.id) ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <ToggleCategoryButton
                        id={cat.id}
                        isActive={cat.is_active}
                        hasResources={(resourceCountMap.get(cat.id) ?? 0) > 0}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/backstage-cl-hq-manage-9x3kp2/categories/${cat.id}/edit`}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
