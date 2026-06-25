import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { SoftDeleteCreatorButton } from "@/components/admin/SoftDeleteCreatorButton";

export const metadata: Metadata = {
  title: `Creators — ${APP_NAME} Admin`,
};

const PAGE_SIZE = 20;

interface SearchParams {
  q?: string;
  page?: string;
}

export default async function AdminCreatorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const search = q?.trim() ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("creators")
    .select("id, name, slug, avatar_path, is_public, is_verified, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: creators, count } = await query;

  // Resource counts per creator
  type CreatorId = { creator_id: string };
  const creatorIds = (creators ?? []).map((c) => c.id);
  let resourceCountMap = new Map<string, number>();
  if (creatorIds.length > 0) {
    const { data: resCounts } = await supabase
      .from("resources")
      .select("creator_id")
      .in("creator_id", creatorIds)
      .eq("status", "published")
      .returns<CreatorId[]>();
    const counts = (resCounts ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.creator_id] = (acc[r.creator_id] ?? 0) + 1;
      return acc;
    }, {});
    resourceCountMap = new Map(Object.entries(counts));
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Creators</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {count ?? 0} total creator{count !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/creators/new"
          className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New creator
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="mb-6">
        <input
          name="q"
          type="search"
          defaultValue={search}
          placeholder="Search by name..."
          className="w-full max-w-xs rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {(creators ?? []).length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? `No creators matching "${search}".` : "No creators yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Creator
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Resources
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(creators ?? []).map((creator) => (
                  <tr key={creator.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                          {creator.avatar_path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={creator.avatar_path}
                              alt={creator.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                              {creator.name[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-foreground">{creator.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {creator.slug}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {resourceCountMap.get(creator.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          creator.is_public
                            ? "bg-green-50 text-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {creator.is_public ? "Public" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/creators/${creator.id}/edit`}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        {creator.is_public && (
                          <SoftDeleteCreatorButton id={creator.id} name={creator.name} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
