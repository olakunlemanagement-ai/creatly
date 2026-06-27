import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, ClipboardList } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { getPreviewImageUrl } from "@/lib/storage";
import { ResourceQuickActions } from "@/components/admin/ResourceQuickActions";

export const metadata: Metadata = {
  title: `Resources — ${APP_NAME} Admin`,
};

const PAGE_SIZE = 20;

interface SearchParams {
  q?: string;
  status?: string;
  category?: string;
  creator?: string;
  featured?: string;
  page?: string;
}

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const query = sp.q?.trim() ?? "";
  const filterStatus = sp.status ?? "";
  const filterCategory = sp.category ?? "";
  const filterCreator = sp.creator ?? "";
  const filterFeatured = sp.featured ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // Build resource query with filters
  let resourceQuery = supabase
    .from("resources")
    .select(
      "id, title, slug, status, review_status, is_featured, download_count, created_at, preview_image_path, category_id, creator_id, creators(name), categories(name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (query) resourceQuery = resourceQuery.ilike("title", `%${query}%`);
  if (filterStatus) resourceQuery = resourceQuery.eq("status", filterStatus);
  if (filterCategory) resourceQuery = resourceQuery.eq("category_id", filterCategory);
  if (filterCreator) resourceQuery = resourceQuery.eq("creator_id", filterCreator);
  if (filterFeatured === "yes") resourceQuery = resourceQuery.eq("is_featured", true);

  const { data: resources, count } = await resourceQuery;

  // Fetch filter options
  const [{ data: categories }, { data: creators }, { count: pendingCount }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("creators").select("id, name").eq("is_public", true).order("name"),
    supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("review_status", "submitted"),
  ]);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const rows = resources ?? [];

  function buildUrl(overrides: Partial<SearchParams>): string {
    const params = new URLSearchParams();
    const merged = { q: query, status: filterStatus, category: filterCategory, creator: filterCreator, featured: filterFeatured, page: String(page), ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `/backstage-cl-hq-manage-9x3kp2/resources?${params.toString()}`;
  }

  const statusBadge: Record<string, string> = {
    published: "bg-green-100 text-green-700",
    draft: "bg-muted text-muted-foreground",
    archived: "bg-red-100 text-red-700",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Resources</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{count ?? 0} total</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/backstage-cl-hq-manage-9x3kp2/review"
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            Pending review {(pendingCount ?? 0) > 0 && `(${pendingCount})`}
          </Link>
          <Link
            href="/backstage-cl-hq-manage-9x3kp2/resources/new"
            className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Upload resource
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="mb-5 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by title…"
          className="min-w-48 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand-green-500 focus:ring-1 focus:ring-brand-green-500"
        />
        <select
          name="status"
          defaultValue={filterStatus}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          name="category"
          defaultValue={filterCategory}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
        >
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          name="creator"
          defaultValue={filterCreator}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
        >
          <option value="">All creators</option>
          {(creators ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          name="featured"
          defaultValue={filterFeatured}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
        >
          <option value="">All</option>
          <option value="yes">Featured only</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-brand-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-800 transition-colors"
        >
          Filter
        </button>
        <Link
          href="/backstage-cl-hq-manage-9x3kp2/resources"
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Clear
        </Link>
      </form>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">No resources found.</p>
          <Link href="/backstage-cl-hq-manage-9x3kp2/resources/new" className="mt-2 inline-block text-sm font-medium text-brand-green-700 hover:underline">
            Upload the first resource
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Creator</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Downloads</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  type ResourceRow = typeof r & {
                    creators: { name: string } | null;
                    categories: { name: string } | null;
                  };
                  const row = r as ResourceRow;
                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.preview_image_path && (
                            <div className="relative h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                              <Image
                                src={getPreviewImageUrl(r.preview_image_path)}
                                alt={r.title}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground max-w-[200px]">{r.title}</p>
                            <p className="text-xs text-muted-foreground font-mono">{r.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {row.creators?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {row.categories?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[r.status] ?? "bg-muted text-muted-foreground"}`}>
                            {r.status}
                          </span>
                          {r.is_featured && (
                            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {r.download_count}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <ResourceQuickActions
                            id={r.id}
                            isFeatured={r.is_featured}
                            status={r.status}
                          />
                          <Link
                            href={`/backstage-cl-hq-manage-9x3kp2/resources/${r.id}/edit`}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
