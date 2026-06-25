import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Resource, Category } from "@/types/database";

export const metadata: Metadata = { title: `My Assets — ${APP_NAME}` };

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-muted text-muted-foreground" },
  submitted: { label: "In review", className: "bg-amber-100 text-amber-700" },
  approved:  { label: "Published", className: "bg-green-100 text-green-700" },
  rejected:  { label: "Rejected",  className: "bg-red-100 text-red-700" },
};

type AssetRow = Pick<Resource,
  "id" | "title" | "slug" | "review_status" | "rejection_reason" |
  "status" | "preview_image_path" | "created_at" | "download_count" | "category_id"
>;

export default async function StudioAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) return null;

  const supabase = await createClient();

  const [creatorResult, categoriesResult] = await Promise.all([
    supabase.from("creators").select("id").eq("user_id", auth.user.id).maybeSingle(),
    supabase
      .from("categories")
      .select("id, name, slug, level, parent_id")
      .eq("is_active", true)
      .eq("level", 1)
      .order("sort_order")
      .returns<Pick<Category, "id" | "name" | "slug" | "level" | "parent_id">[]>(),
  ]);

  const { data: creator } = creatorResult;
  const categories = categoriesResult.data ?? [];

  const { status: filterStatus, category: filterCategory } = await searchParams;

  if (!creator) return <EmptyState />;

  let query = supabase
    .from("resources")
    .select(
      "id, title, slug, review_status, rejection_reason, status, preview_image_path, created_at, download_count, category_id",
    )
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });

  if (filterStatus && ["draft", "submitted", "approved", "rejected"].includes(filterStatus)) {
    query = query.eq("review_status", filterStatus);
  }

  if (filterCategory) {
    const matchedCat = categories.find((c) => c.slug === filterCategory);
    if (matchedCat) {
      query = query.eq("category_id", matchedCat.id);
    }
  }

  const { data: assets } = await query.returns<AssetRow[]>();

  const STATUS_FILTERS = [
    { value: "", label: "All" },
    { value: "approved", label: "Published" },
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "In Review" },
    { value: "rejected", label: "Rejected" },
  ];

  function buildHref(params: { status?: string; category?: string }) {
    const merged = {
      status: params.status ?? filterStatus ?? "",
      category: params.category ?? filterCategory ?? "",
    };
    const qs = new URLSearchParams();
    if (merged.status) qs.set("status", merged.status);
    if (merged.category) qs.set("category", merged.category);
    const str = qs.toString();
    return str ? `/creator/assets?${str}` : "/creator/assets";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {"// My uploads"}
          </p>
          <h1
            className="mt-1 font-heading text-3xl text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Assets
          </h1>
        </div>
        <Link
          href="/creator/upload"
          className="shrink-0 rounded-xl bg-terracotta-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600"
        >
          Upload →
        </Link>
      </div>

      {/* Two-column layout: sidebar + grid */}
      <div className="flex gap-8">

        {/* ── Left sidebar ── */}
        <aside className="hidden w-52 shrink-0 lg:block">
          {/* Status filter */}
          <div className="mb-6">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Status
            </p>
            <ul className="space-y-0.5">
              {STATUS_FILTERS.map(({ value, label }) => {
                const active = (filterStatus ?? "") === value;
                return (
                  <li key={value}>
                    <Link
                      href={buildHref({ status: value, category: filterCategory })}
                      className={[
                        "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-foreground/10 font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      ].join(" ")}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Category
              </p>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href={buildHref({ category: "", status: filterStatus })}
                    className={[
                      "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                      !filterCategory
                        ? "bg-foreground/10 font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    All categories
                  </Link>
                </li>
                {categories.map((cat) => {
                  const active = filterCategory === cat.slug;
                  return (
                    <li key={cat.id}>
                      <Link
                        href={buildHref({ category: cat.slug, status: filterStatus })}
                        className={[
                          "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-foreground/10 font-semibold text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        ].join(" ")}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <div className="min-w-0 flex-1">
          {/* Mobile filters (horizontal scroll) */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {STATUS_FILTERS.map(({ value, label }) => (
              <Link
                key={value}
                href={buildHref({ status: value, category: filterCategory })}
                className={[
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  (filterStatus ?? "") === value
                    ? "bg-foreground text-background"
                    : "border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </Link>
            ))}
          </div>

          {!assets || assets.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => {
                const badge = STATUS_BADGE[asset.review_status] ?? STATUS_BADGE.draft;
                return (
                  <li
                    key={asset.id}
                    className="flex flex-col rounded-xl border border-border bg-card overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-40 w-full bg-muted">
                      {asset.preview_image_path ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resource-previews/${asset.preview_image_path}`}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted" />
                      )}
                      {/* Status badge overlay */}
                      <span
                        className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <p className="line-clamp-2 text-sm font-medium text-foreground leading-snug">
                        {asset.title}
                      </p>

                      {asset.rejection_reason && asset.review_status === "rejected" && (
                        <p className="text-xs text-destructive line-clamp-2">
                          {asset.rejection_reason}
                        </p>
                      )}

                      <p className="mt-auto text-xs text-muted-foreground">
                        {asset.download_count} download{asset.download_count !== 1 ? "s" : ""} ·{" "}
                        {new Date(asset.created_at).toLocaleDateString()}
                      </p>

                      <div className="flex gap-1.5">
                        {(asset.review_status === "draft" || asset.review_status === "rejected") && (
                          <Link
                            href={`/creator/upload?edit=${asset.id}`}
                            className="flex-1 rounded-lg border border-border py-1.5 text-center text-xs font-medium text-foreground/80 transition-colors hover:border-foreground/40"
                          >
                            Edit
                          </Link>
                        )}
                        <Link
                          href={`/resources/${asset.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-lg border border-border py-1.5 text-center text-xs font-medium text-foreground/80 transition-colors hover:border-foreground/40"
                        >
                          {asset.review_status === "approved" ? "View live ↗" : "Preview ↗"}
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <p className="font-semibold text-foreground">No assets yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload your first template, font, or mockup to get started.
      </p>
      <Link
        href="/creator/upload"
        className="mt-6 inline-block rounded-xl bg-terracotta-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600"
      >
        Upload your first asset →
      </Link>
    </div>
  );
}
