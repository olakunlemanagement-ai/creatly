import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, CheckCircle2 } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { SoftDeleteCreatorButton } from "@/components/admin/SoftDeleteCreatorButton";

export const metadata: Metadata = {
  title: `Creators — ${APP_NAME} Admin`,
};

const PAGE_SIZE = 20;

interface SearchParams {
  q?: string;
  status?: string;
  verified?: string;
  page?: string;
}

export default async function AdminCreatorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const search = sp.q?.trim() ?? "";
  const statusFilter = sp.status ?? "";
  const verifiedFilter = sp.verified ?? "";

  const supabase = await createClient();

  // Base query — join creator_profiles to get handle + user_id
  let query = supabase
    .from("creators")
    .select(
      `id, name, slug, avatar_path, is_public, is_verified, created_at,
       creator_profiles(user_id, handle, profiles(email, full_name))`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (statusFilter === "public") {
    query = query.eq("is_public", true);
  } else if (statusFilter === "hidden") {
    query = query.eq("is_public", false);
  }
  if (verifiedFilter === "verified") {
    query = query.eq("is_verified", true);
  } else if (verifiedFilter === "unverified") {
    query = query.eq("is_verified", false);
  }

  const { data: rawCreators, count } = await query;

  type CreatorRow = {
    id: string;
    name: string;
    slug: string;
    avatar_path: string | null;
    is_public: boolean;
    is_verified: boolean;
    created_at: string | null;
    creator_profiles: {
      user_id: string;
      handle: string | null;
      profiles: { email: string; full_name: string | null } | null;
    } | null;
  };

  const creators = (rawCreators ?? []) as unknown as CreatorRow[];

  // Resource counts + total downloads per creator
  const creatorIds = creators.map((c) => c.id);
  const resourceCountMap = new Map<string, number>();
  const downloadCountMap = new Map<string, number>();

  if (creatorIds.length > 0) {
    const [{ data: resCounts }, { data: dlCounts }] = await Promise.all([
      supabase
        .from("resources")
        .select("creator_id")
        .in("creator_id", creatorIds)
        .eq("status", "published"),
      supabase
        .from("downloads")
        .select("creator_id")
        .in("creator_id", creatorIds),
    ]);

    for (const r of resCounts ?? []) {
      if (r.creator_id) resourceCountMap.set(r.creator_id, (resourceCountMap.get(r.creator_id) ?? 0) + 1);
    }
    for (const d of dlCounts ?? []) {
      if (d.creator_id) downloadCountMap.set(d.creator_id, (downloadCountMap.get(d.creator_id) ?? 0) + 1);
    }
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" }) : "—";

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({
      ...(search && { q: search }),
      ...(statusFilter && { status: statusFilter }),
      ...(verifiedFilter && { verified: verifiedFilter }),
      page: "1",
      ...overrides,
    });
    return `/backstage-cl-hq-manage-9x3kp2/creators?${p.toString()}`;
  }

  const VISIBILITY = [
    { value: "", label: "All" },
    { value: "public", label: "Public" },
    { value: "hidden", label: "Hidden" },
  ];

  const VERIFIED = [
    { value: "", label: "All" },
    { value: "verified", label: "Verified" },
    { value: "unverified", label: "Unverified" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Creators</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {(count ?? 0).toLocaleString()} total creator{count !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/backstage-cl-hq-manage-9x3kp2/creators/new"
          className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New creator
        </Link>
      </div>

      {/* ── Filters ── */}
      <div className="mb-6 flex flex-wrap gap-3">
        <form method="GET" action="/backstage-cl-hq-manage-9x3kp2/creators" className="flex-1 min-w-48">
          <input
            name="q"
            type="text"
            defaultValue={search}
            placeholder="Search by name…"
            className="w-full max-w-xs rounded-xl border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {verifiedFilter && <input type="hidden" name="verified" value={verifiedFilter} />}
        </form>

        <div className="flex gap-1">
          {VISIBILITY.map((v) => (
            <Link
              key={v.value}
              href={buildUrl({ status: v.value })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === v.value
                  ? "border-brand-green-700 bg-brand-green-700 text-white"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {v.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-1">
          {VERIFIED.map((v) => (
            <Link
              key={v.value}
              href={buildUrl({ verified: v.value })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                verifiedFilter === v.value
                  ? "border-terracotta-500 bg-terracotta-500 text-white"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Creator</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resources</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Downloads</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {creators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {search ? `No creators matching "${search}".` : "No creators yet."}
                  </td>
                </tr>
              ) : (
                creators.map((creator) => {
                  const profile = creator.creator_profiles;
                  const email = profile?.profiles?.email ?? "—";
                  return (
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
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {creator.name}
                              {creator.is_verified && (
                                <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-brand-green-600" />
                              )}
                            </p>
                            {profile?.handle && (
                              <p className="truncate text-xs text-muted-foreground">@{profile.handle}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{email}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {(resourceCountMap.get(creator.id) ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                        {(downloadCountMap.get(creator.id) ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {fmt(creator.created_at)}
                      </td>
                      <td className="px-4 py-3">
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
                            href={`/backstage-cl-hq-manage-9x3kp2/creators/${creator.id}/edit`}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="rounded-xl border border-border px-4 py-2 font-medium hover:bg-muted transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="rounded-xl border border-border px-4 py-2 font-medium hover:bg-muted transition-colors"
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
