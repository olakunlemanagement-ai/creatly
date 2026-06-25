import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPreviewImageUrl } from "@/lib/storage";
import type { ResourceCardData } from "@/components/resource/ResourceCard";

export const metadata: Metadata = { title: `Home — ${APP_NAME}` };

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function CreatorHomePage() {
  const auth = await getAuthenticatedUser();
  if (!auth) return null;

  const supabase = await createClient();

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("display_name, handle")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const displayName =
    creatorProfile?.display_name ??
    auth.profile.full_name ??
    auth.user.email.split("@")[0];

  let totalUploads = 0;
  let totalDownloads = 0;
  let draftsPending = 0;
  let recentUploads: { id: string; title: string; review_status: string; created_at: string }[] = [];

  if (creator) {
    const [uploadsRes, downloadsRes, draftsRes, recentRes] = await Promise.all([
      supabase
        .from("resources")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creator.id),
      supabase
        .from("downloads")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creator.id),
      supabase
        .from("resources")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creator.id)
        .eq("review_status", "draft"),
      supabase
        .from("resources")
        .select("id, title, review_status, created_at")
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: false })
        .limit(3)
        .returns<{ id: string; title: string; review_status: string; created_at: string }[]>(),
    ]);

    totalUploads = uploadsRes.count ?? 0;
    totalDownloads = downloadsRes.count ?? 0;
    draftsPending = draftsRes.count ?? 0;
    recentUploads = recentRes.data ?? [];
  }

  const { data: featuredRaw } = await supabase
    .from("resources")
    .select("*, creators(name), categories(name, slug)")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(4);

  const featured = (featuredRaw as ResourceCardData[] | null) ?? [];

  const STATS = [
    { label: "Total uploads", value: totalUploads, href: "/creator/assets" },
    { label: "Total downloads", value: totalDownloads, href: "/creator" },
    { label: "Drafts pending", value: draftsPending, href: "/creator/assets?status=draft" },
  ];

  const QUICK_ACTIONS = [
    { label: "Upload new asset →", href: "/creator/upload", primary: true },
    { label: "View my assets", href: "/creator/assets", primary: false },
    { label: "Edit profile", href: "/creator/profile", primary: false },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6">

      {/* Hero */}
      <section>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {"// CREATOR DASHBOARD"}
        </p>
        <h1
          className="mt-2 font-heading text-4xl text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Welcome back, {displayName}.
        </h1>
      </section>

      {/* Quick stats */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map(({ label, value, href }) => (
            <Link
              key={label}
              href={href}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
            >
              <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Quick actions
        </p>
        <div className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map(({ label, href, primary }) => (
            <Link
              key={label}
              href={href}
              className={
                primary
                  ? "rounded-xl bg-terracotta-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600"
                  : "rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/30"
              }
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Browse the marketplace */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Browse the marketplace
          </p>
          <Link
            href="/browse"
            className="text-xs font-medium text-terracotta-500 hover:text-terracotta-600"
          >
            Browse all →
          </Link>
        </div>

        {featured.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featured.map((r) => {
              const previewUrl = getPreviewImageUrl(r.preview_image_path);
              return (
                <li key={r.id}>
                  <Link
                    href={`/resources/${r.slug}`}
                    className="group block overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] bg-muted">
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          alt={r.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No preview
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                      {r.creators?.name && (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {r.creators.name}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No featured resources yet.</p>
        )}
      </section>

      {/* Recent activity */}
      {recentUploads.length > 0 && (
        <section>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Recent uploads
          </p>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {recentUploads.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <Link
                  href={`/creator/assets`}
                  className="truncate text-sm font-medium text-foreground hover:text-terracotta-500"
                >
                  {r.title}
                </Link>
                <span
                  className={`ml-4 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[r.review_status] ?? "bg-muted text-muted-foreground"}`}
                >
                  {r.review_status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
