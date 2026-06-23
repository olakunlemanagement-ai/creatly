import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Resource } from "@/types/database";

export const metadata: Metadata = { title: `My Assets — ${APP_NAME}` };

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-muted text-muted-foreground" },
  submitted: { label: "In review", className: "bg-amber-100 text-amber-700" },
  approved:  { label: "Published", className: "bg-green-100 text-green-700" },
  rejected:  { label: "Rejected",  className: "bg-red-100 text-red-700" },
};

type AssetRow = Pick<Resource,
  "id" | "title" | "slug" | "review_status" | "rejection_reason" |
  "status" | "preview_image_path" | "created_at" | "download_count"
>;

export default async function StudioAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) return null;

  const supabase = await createClient();

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const { status: filterStatus } = await searchParams;

  let query = supabase
    .from("resources")
    .select(
      "id, title, slug, review_status, rejection_reason, status, preview_image_path, created_at, download_count",
    )
    .order("created_at", { ascending: false });

  if (creator) {
    query = query.eq("creator_id", creator.id);
  } else {
    return <EmptyState />;
  }

  if (filterStatus && ["draft", "submitted", "approved", "rejected"].includes(filterStatus)) {
    query = query.eq("review_status", filterStatus);
  }

  const { data: assets } = await query.returns<AssetRow[]>();

  const FILTER_TABS = [
    { value: "", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "In review" },
    { value: "approved", label: "Published" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {"// My assets"}
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

      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {FILTER_TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={value ? `/creator/assets?status=${value}` : "/creator/assets"}
            className={[
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
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
        <ul className="space-y-3">
          {assets.map((asset) => {
            const badge = STATUS_BADGE[asset.review_status] ?? STATUS_BADGE.draft;
            return (
              <li
                key={asset.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
              >
                {asset.preview_image_path ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resource-previews/${asset.preview_image_path}`}
                    alt=""
                    width={80}
                    height={56}
                    className="h-14 w-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-14 w-20 shrink-0 rounded-lg bg-muted" />
                )}

                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{asset.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  {asset.rejection_reason && asset.review_status === "rejected" && (
                    <p className="text-xs text-destructive">
                      Rejection reason: {asset.rejection_reason}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {asset.download_count} download{asset.download_count !== 1 ? "s" : ""} ·{" "}
                    {new Date(asset.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-1.5">
                  {(asset.review_status === "draft" || asset.review_status === "rejected") && (
                    <Link
                      href={`/creator/upload?edit=${asset.id}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-foreground/40"
                    >
                      Edit
                    </Link>
                  )}
                  {asset.review_status === "approved" && (
                    <Link
                      href={`/resources/${asset.slug}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-foreground/40"
                    >
                      View live
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
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
