import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserEntitlement } from "@/lib/entitlement";
import { APP_NAME } from "@/lib/config";
import { formatBytes } from "@/lib/format";
import { ResourceDetailGallery } from "@/components/resource/ResourceDetailGallery";
import { DownloadButton } from "@/components/resource/DownloadButton";
import type { EntitlementState } from "@/components/resource/DownloadButton";
import { FavouriteButton } from "@/components/resource/FavouriteButton";
import { ResourceCard, type ResourceCardData } from "@/components/resource/ResourceCard";
import { ResourceGrid } from "@/components/resource/ResourceGrid";
import { recordRecentlyViewed } from "@/lib/actions/recently-viewed";
import { TrialStartButton } from "@/components/shared/TrialStartButton";
import type { Resource, Creator, Category } from "@/types/database";

// ─── Joined resource type for this page ───────────────────────────────────────

type CategoryWithParent = Pick<Category, "name" | "slug" | "parent_id"> & {
  parent?: Pick<Category, "name" | "slug"> | null;
};

type ResourceDetail = Resource & {
  creators: Pick<Creator, "name" | "slug" | "avatar_path" | "is_public"> | null;
  categories: CategoryWithParent | null;
};

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

  // Fetch resource + current user in parallel.
  // categories join includes parent_id so we can build the breadcrumb path.
  const [{ data: resource, error }, auth] = await Promise.all([
    supabase
      .from("resources")
      .select("*, creators(name, slug, avatar_path, is_public), categories(name, slug, parent_id)")
      .eq("slug", slug)
      .eq("status", "published")
      .single(),
    getAuthenticatedUser(),
  ]);

  if (error || !resource) notFound();

  const typedResource = resource as ResourceDetail;
  const userId = auth?.user.id ?? null;

  // Fire-and-forget: track view for logged-in users without blocking render
  if (userId) {
    void recordRecentlyViewed(userId, typedResource.id);
  }

  // Fetch the parent category for breadcrumb (one extra query, cheap)
  let parentCategory: Pick<Category, "name" | "slug"> | null = null;
  if (typedResource.categories?.parent_id) {
    const { data: parentCat } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("id", typedResource.categories.parent_id)
      .single();
    parentCategory = parentCat ?? null;
  }

  // Fetch related resources, entitlement, and all favourite IDs in parallel.
  // Fetching all favourite IDs (not just one) lets both the sidebar heart and the
  // related-resource cards show the correct filled/hollow state without N queries.
  const noEntitlement = Promise.resolve({
    entitled: false as const,
    subscription: null,
    reason: "no_subscription" as const,
  });
  const [{ data: relatedData }, entitlementResult, { data: favouriteRows }] = await Promise.all([
    supabase
      .from("resources")
      .select("*, creators(name), categories(name, slug)")
      .eq("status", "published")
      .eq("category_id", typedResource.category_id)
      .neq("slug", slug)
      .order("created_at", { ascending: false })
      .limit(6),
    userId ? getUserEntitlement(userId) : noEntitlement,
    userId
      ? supabase
          .from("favourites")
          .select("resource_id")
          .eq("user_id", userId)
      : Promise.resolve({ data: [] as { resource_id: string }[] }),
  ]);

  // Map server entitlement result to the UI state the DownloadButton consumes
  const entitlement: EntitlementState = !userId
    ? "guest"
    : entitlementResult.entitled
      ? "subscriber"
      : "free";

  // Show trial CTA to logged-in free users who haven't used their trial
  const trialUsed = !!(auth?.profile as unknown as { trial_used?: boolean })?.trial_used;
  const showTrialCta = entitlement === "free" && !trialUsed;

  const favouriteIds = new Set(
    (favouriteRows ?? []).map((f: { resource_id: string }) => f.resource_id),
  );
  const isFavourited = favouriteIds.has(typedResource.id);

  const related = (relatedData ?? []) as ResourceCardData[];
  const mimeLabel = getMimeLabel(typedResource.file_type);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      {/* Breadcrumb — shows full category path */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/browse" className="hover:text-foreground transition-colors">
          Browse
        </Link>
        {parentCategory && (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/browse?category=${parentCategory.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {parentCategory.name}
            </Link>
          </>
        )}
        {typedResource.categories && (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/browse?category=${typedResource.categories.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {typedResource.categories.name}
            </Link>
          </>
        )}
        <span aria-hidden>/</span>
        <span className="text-foreground font-medium">{typedResource.title}</span>
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
            {typedResource.creators?.is_public && typedResource.creators.slug ? (
              <Link
                href={`/creators/${typedResource.creators.slug}`}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {typedResource.creators.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground">
                {typedResource.creators?.name ?? "Unknown creator"}
              </span>
            )}
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
            <DownloadButton
              entitlement={entitlement}
              resourceId={typedResource.id}
              resourceSlug={slug}
            />
            {showTrialCta && (
              <div className="mt-3 flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Or try free for 7 days — no credit card needed.</p>
                <TrialStartButton className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta-600 underline underline-offset-2 hover:text-terracotta-700" />
              </div>
            )}
          </div>

          {/* Favourite */}
          <FavouriteButton
            resourceId={typedResource.id}
            resourceSlug={typedResource.slug}
            isFavourited={isFavourited}
            userId={userId}
            variant="sidebar"
          />
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
              <ResourceCard
                key={r.id}
                resource={r}
                isFavourited={favouriteIds.has(r.id)}
                userId={userId}
              />
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
