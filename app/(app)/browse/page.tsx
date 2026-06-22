import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { browseParamsSchema } from "@/lib/validations/browse";
import { BrowseHero } from "@/components/resource/BrowseHero";
import { CategoryQuickNav } from "@/components/resource/CategoryQuickNav";
import { FeaturedStrip } from "@/components/resource/FeaturedStrip";
import { SortControl } from "@/components/resource/SortControl";
import { ResourceCard, type ResourceCardData } from "@/components/resource/ResourceCard";
import { ResourceGrid } from "@/components/resource/ResourceGrid";
import { CatalogueEmptyState } from "@/components/resource/CatalogueEmptyState";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: `Browse resources — ${APP_NAME}`,
};

const PAGE_SIZE = 24;

interface BrowsePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const raw = await searchParams;

  const params = browseParamsSchema.parse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    category: typeof raw.category === "string" ? raw.category : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
  });

  const { q, category: categorySlug, sort, page } = params;
  const offset = (page - 1) * PAGE_SIZE;
  const isFiltered = Boolean(q || categorySlug);

  const [supabase, auth] = await Promise.all([createClient(), getAuthenticatedUser()]);
  const userId = auth?.user.id ?? null;

  // Resolve category slug → ID before building the main query
  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .single();
    categoryId = cat?.id ?? null;
  }

  // Build the paginated resource query with all active filters
  let resourceQuery = supabase
    .from("resources")
    .select("*, creators(name), categories(name, slug)", { count: "exact" })
    .eq("status", "published");

  if (q) {
    // Strip {}, commas — those are structural characters in the PostgREST filter syntax.
    // websearch_to_tsquery handles the rest (spaces, quotes, punctuation) correctly.
    const filterQ = q.replace(/[{},]/g, " ").replace(/\s+/g, " ").trim();
    if (filterQ) {
      resourceQuery = resourceQuery.or(
        `fts.wfts(english).${filterQ},tags.ov.{${filterQ}}`,
      );
    }
  }

  // Apply category filter only when the slug resolved to a known ID.
  // If the slug is unknown, we fall through without filtering (show all, per spec).
  if (categoryId) {
    resourceQuery = resourceQuery.eq("category_id", categoryId);
  }

  if (sort === "popular") {
    resourceQuery = resourceQuery
      .order("download_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else if (sort === "featured") {
    resourceQuery = resourceQuery
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    resourceQuery = resourceQuery.order("created_at", { ascending: false });
  }

  // Four parallel fetches: nav categories, featured strip (skipped when filtered),
  // paginated grid, and the current user's favourited resource IDs (empty for guests).
  const [
    { data: categories },
    { data: featuredResources },
    { data: resources, count },
    { data: favouriteRows },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order"),
    isFiltered
      ? Promise.resolve({ data: [] as ResourceCardData[] })
      : supabase
          .from("resources")
          .select("*, creators(name), categories(name, slug)")
          .eq("status", "published")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(6),
    resourceQuery.range(offset, offset + PAGE_SIZE - 1),
    // Fetch all favourited IDs for this user in one query; guests get an empty array.
    userId
      ? supabase
          .from("favourites")
          .select("resource_id")
          .eq("user_id", userId)
      : Promise.resolve({ data: [] as { resource_id: string }[] }),
  ]);

  const favouriteIds = new Set((favouriteRows ?? []).map((f) => f.resource_id));

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const isEmpty = (resources?.length ?? 0) === 0;

  // Find the active category name for the section heading
  const activeCategoryName = categorySlug
    ? (categories?.find((c) => c.slug === categorySlug)?.name ?? categorySlug)
    : null;

  return (
    <>
      <Suspense>
        <BrowseHero initialQuery={q ?? ""} />
      </Suspense>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <Suspense>
            <CategoryQuickNav
              categories={categories ?? []}
              activeCategory={categorySlug ?? null}
            />
          </Suspense>
        </Reveal>

        {!isFiltered && (
          <FeaturedStrip
            resources={featuredResources as ResourceCardData[]}
            favouriteIds={favouriteIds}
            userId={userId}
          />
        )}

        {/* Results */}
        <section aria-labelledby="results-heading" className="border-t py-8">
          <Reveal className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="results-heading" className="text-lg font-semibold tracking-tight">
              {q ? (
                <>
                  Results for{" "}
                  <span className="text-terracotta-600">&#34;{q}&#34;</span>
                </>
              ) : activeCategoryName ? (
                activeCategoryName
              ) : (
                "All resources"
              )}
            </h2>

            <div className="flex items-center gap-3">
              {totalCount > 0 && (
                <p className="whitespace-nowrap text-sm text-muted-foreground">
                  {totalCount.toLocaleString()}{" "}
                  {totalCount === 1 ? "resource" : "resources"}
                </p>
              )}
              <Suspense>
                <SortControl activeSort={sort} />
              </Suspense>
            </div>
          </Reveal>

          {isEmpty ? (
            <CatalogueEmptyState variant={isFiltered ? "search-empty" : "cold-start"} />
          ) : (
            <>
              <ResourceGrid>
                {(resources as ResourceCardData[]).map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    isFavourited={favouriteIds.has(resource.id)}
                    userId={userId}
                  />
                ))}
              </ResourceGrid>

              {totalPages > 1 && (
                <Reveal delay={100} className="mt-10 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild={page > 1}
                    disabled={page <= 1}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    aria-label="Previous page"
                  >
                    {page > 1 ? (
                      <Link href={buildPageUrl(raw, page - 1)}>
                        <ChevronLeft className="size-4" />
                        Previous
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1">
                        <ChevronLeft className="size-4" />
                        Previous
                      </span>
                    )}
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild={page < totalPages}
                    disabled={page >= totalPages}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    aria-label="Next page"
                  >
                    {page < totalPages ? (
                      <Link href={buildPageUrl(raw, page + 1)}>
                        Next
                        <ChevronRight className="size-4" />
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1">
                        Next
                        <ChevronRight className="size-4" />
                      </span>
                    )}
                  </Button>
                </Reveal>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}

/** Build a pagination URL preserving active search/filter/sort params. */
function buildPageUrl(
  raw: { [key: string]: string | string[] | undefined },
  newPage: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (key !== "page" && typeof value === "string" && value.trim()) {
      params.set(key, value);
    }
  }
  if (newPage > 1) params.set("page", String(newPage));
  const qs = params.toString();
  return `/browse${qs ? `?${qs}` : ""}`;
}
