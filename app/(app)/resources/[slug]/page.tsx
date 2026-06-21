import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/config";
import { formatBytes } from "@/lib/format";
import { ResourceDetailGallery } from "@/components/resource/ResourceDetailGallery";
import { DownloadButton, type EntitlementState } from "@/components/resource/DownloadButton";
import { ResourceCard, type ResourceCardData } from "@/components/resource/ResourceCard";
import { ResourceGrid } from "@/components/resource/ResourceGrid";
import type { Resource, Creator, Category } from "@/types/database";

// ─── Joined resource type for this page ───────────────────────────────────────

type ResourceDetail = Resource & {
  creators: Pick<Creator, "name" | "slug" | "avatar_path" | "is_public"> | null;
  categories: Pick<Category, "name" | "slug"> | null;
};

// ─── Entitlement stub ──────────────────────────────────────────────────────────
// Reads an active subscription owned by this user.
// Pre-Phase 2, no subscriptions exist so all authenticated users return 'free'.
// When Phase 2 wires Paystack webhooks, active subscriptions populate here naturally.
// NOTE for 1.8: the real getUserEntitlement() in lib/entitlement.ts must ALSO check
// team membership via team_members.profile_id = userId joined to an active subscription,
// since team members are entitled but are not the subscription owner_id.
// Step 1.8 replaces the download action with the real guarded mechanic.
async function getDetailPageEntitlement(
  userId: string | null,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<EntitlementState> {
  if (!userId) return "guest";
  const { data } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("owner_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  return data ? "subscriber" : "free";
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: resource } = await supabase
    .from("resources")
    .select("title")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!resource) return { title: APP_NAME };
  return { title: `${resource.title} — ${APP_NAME}` };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ResourceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch resource + current user in parallel
  const [{ data: resource, error }, auth] = await Promise.all([
    supabase
      .from("resources")
      .select("*, creators(name, slug, avatar_path, is_public), categories(name, slug)")
      .eq("slug", slug)
      .eq("status", "published")
      .single(),
    getAuthenticatedUser(),
  ]);

  if (error || !resource) notFound();

  const typedResource = resource as ResourceDetail;

  // Fetch related resources + entitlement — both depend on the resource/user above
  const [{ data: relatedData }, entitlement] = await Promise.all([
    supabase
      .from("resources")
      .select("*, creators(name), categories(name, slug)")
      .eq("status", "published")
      .eq("category_id", typedResource.category_id)
      .neq("slug", slug)
      .order("created_at", { ascending: false })
      .limit(6),
    getDetailPageEntitlement(auth?.user.id ?? null, supabase),
  ]);

  const related = (relatedData ?? []) as ResourceCardData[];
  const mimeLabel = getMimeLabel(typedResource.file_type);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/browse"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to browse
        </Link>
      </nav>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr] lg:gap-12">
        {/* Gallery — left col */}
        <ResourceDetailGallery
          primaryImage={typedResource.preview_image_path}
          additionalImages={typedResource.preview_images}
          title={typedResource.title}
        />

        {/* Sidebar — right col; sticky on desktop so the download CTA stays visible while scrolling the gallery */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-terracotta-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-terracotta-700">
              {mimeLabel}
            </span>
            {typedResource.categories?.name && (
              <span className="inline-flex items-center rounded-full bg-brand-green-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-green-700">
                {typedResource.categories.name}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-heading text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
            {typedResource.title}
          </h1>

          {/* Creator */}
          <p className="text-sm text-muted-foreground">
            by{" "}
            <span className="font-medium text-foreground">
              {typedResource.creators?.name ?? "Unknown creator"}
            </span>
          </p>

          {/* Description */}
          {typedResource.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {typedResource.description}
            </p>
          )}

          {/* Meta row */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                File size
              </dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {formatBytes(typedResource.file_size_bytes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Downloads
              </dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {typedResource.download_count.toLocaleString()}
              </dd>
            </div>
          </dl>

          {/* Compatible software */}
          {typedResource.compatible_software.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Compatible with
              </p>
              <div className="flex flex-wrap gap-1.5">
                {typedResource.compatible_software.map((sw) => (
                  <span
                    key={sw}
                    className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-foreground"
                  >
                    {sw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {typedResource.tags.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {typedResource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Download CTA */}
          <div className="border-t border-border pt-4">
            <DownloadButton entitlement={entitlement} resourceSlug={slug} />
          </div>

          {/* Favourite — UI only; backend wired in step 1.7 */}
          <button
            type="button"
            className="flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground"
            disabled
            title="Favourites coming in step 1.7"
          >
            <Heart className="size-4" strokeWidth={1.5} />
            Save to favourites
            {/* TODO 1.7: wire to /api/favourites/[resourceId] */}
          </button>
        </aside>
      </div>

      {/* Related resources */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16 border-t border-border pt-10">
          <h2
            id="related-heading"
            className="mb-6 font-heading text-xl font-semibold text-foreground"
          >
            More like this
          </h2>
          <ResourceGrid>
            {related.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </ResourceGrid>
        </section>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMimeLabel(mimeType: string): string {
  const map: Record<string, string> = {
    "application/zip": "ZIP",
    "application/x-zip-compressed": "ZIP",
    "application/x-figma": "FIGMA",
    "image/vnd.adobe.photoshop": "PSD",
    "application/illustrator": "AI",
    "application/x-coreldraw": "CDR",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
    "video/mp4": "MP4",
    "video/quicktime": "MOV",
    "font/ttf": "TTF",
    "font/otf": "OTF",
    "font/woff": "WOFF",
    "font/woff2": "WOFF2",
    "image/svg+xml": "SVG",
    "image/png": "PNG",
    "image/jpeg": "JPG",
  };
  if (map[mimeType]) return map[mimeType];
  const sub = mimeType.split("/")[1];
  return sub ? sub.split(/[+.-]/)[0].toUpperCase() : "FILE";
}
