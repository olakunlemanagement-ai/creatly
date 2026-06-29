import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { browseParamsSchema } from "@/lib/validations/browse";
import { BrowseHero } from "@/components/resource/BrowseHero";
import { FeaturedStrip } from "@/components/resource/FeaturedStrip";
import { type CategoryTileData } from "@/components/resource/CategoryTiles";
import { CategoryScrollRow, type CategoryScrollItem } from "@/components/resource/CategoryScrollRow";
import { SortControl } from "@/components/resource/SortControl";
import { CategoryFilterSidebar } from "@/components/resource/CategoryFilterSidebar";
import { MobileFilterClientWrapper } from "@/components/resource/MobileFilterClientWrapper";
import { ResourceCard, type ResourceCardData } from "@/components/resource/ResourceCard";
import { ResourceGrid } from "@/components/resource/ResourceGrid";
import { CatalogueEmptyState } from "@/components/resource/CatalogueEmptyState";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NavCategory } from "@/components/nav/SiteHeader";
import type { Category } from "@/types/database";

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

  // ── Build nav category tree (level 1 + level 2) ─────────────────────────────
  const { data: allNavCats } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, level")
    .eq("is_active", true)
    .in("level", [1, 2])
    .order("sort_order")
    .returns<Pick<Category, "id" | "name" | "slug" | "parent_id" | "level">[]>();

  const navCats = allNavCats ?? [];
  const rootMap = new Map<string, NavCategory>();
  for (const cat of navCats) {
    if (cat.level === 1) {
      rootMap.set(cat.id, { id: cat.id, name: cat.name, slug: cat.slug, children: [] });
    }
  }
  for (const cat of navCats) {
    if (cat.level === 2 && cat.parent_id) {
      rootMap.get(cat.parent_id)?.children.push({ id: cat.id, name: cat.name, slug: cat.slug });
    }
  }
  const navCategories: NavCategory[] = Array.from(rootMap.values());

  // ── Resolve active category → subtree IDs for hierarchical filtering ─────────
  let categoryFilterIds: string[] | null = null;
  let activeCategoryName: string | null = null;

  if (categorySlug) {
    const { data: activeCat } = await supabase
      .from("categories")
      .select("id, name")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .single();

    if (activeCat) {
      activeCategoryName = activeCat.name;
      const rootId = activeCat.id;
      categoryFilterIds = [rootId];

      const { data: children } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", rootId)
        .eq("is_active", true);

      const childIds = (children ?? []).map((c) => c.id);
      if (childIds.length > 0) {
        categoryFilterIds.push(...childIds);

        const { data: grandchildren } = await supabase
          .from("categories")
          .select("id")
          .in("parent_id", childIds)
          .eq("is_active", true);

        categoryFilterIds.push(...(grandchildren ?? []).map((c) => c.id));
      }
    }
  }

  // ── Fetch level-3 values of active level-2 category (for sidebar) ───────────
  let activeChildren3: { id: string; name: string; slug: string }[] = [];
  if (categorySlug) {
    const activeCat = navCats.find((c) => c.slug === categorySlug);
    if (activeCat?.level === 2) {
      const { data: vals } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("parent_id", activeCat.id)
        .eq("is_active", true)
        .order("sort_order");
      activeChildren3 = (vals ?? []) as { id: string; name: string; slug: string }[];
    }
  }

  // ── Build resource query ─────────────────────────────────────────────────────
  let resourceQuery = supabase
    .from("resources")
    .select("*, creators(name), categories(name, slug)", { count: "exact" })
    .eq("status", "published");

  if (q) {
    const filterQ = q.replace(/[{},]/g, " ").replace(/\s+/g, " ").trim();
    if (filterQ) {
      resourceQuery = resourceQuery.or(
        `fts.wfts(english).${filterQ},tags.ov.{${filterQ}}`,
      );
    }
  }

  if (categoryFilterIds !== null) {
    if (categoryFilterIds.length > 0) {
      resourceQuery = resourceQuery.in("category_id", categoryFilterIds);
    } else {
      // Unknown slug — force empty result
      resourceQuery = resourceQuery.eq("id", "00000000-0000-0000-0000-000000000000");
    }
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

  // ── Fetch level-1 categories with resource counts (for scroll row — always) ──
  const { data: level1Cats } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .eq("level", 1)
    .order("sort_order")
    .returns<CategoryTileData[]>();

  // Append per-category resource counts + level-2 children for scroll row
  const scrollRowCats: CategoryScrollItem[] = await Promise.all(
    (level1Cats ?? []).map(async (cat) => {
      const { count: rc } = await supabase
        .from("resources")
        .select("id", { count: "exact", head: true })
        .eq("category_id", cat.id)
        .eq("status", "published");
      const children = navCategories.find((nc) => nc.id === cat.id)?.children ?? [];
      return { ...cat, resource_count: rc ?? 0, children };
    }),
  );

  const [{ data: featuredResources }, { data: resources, count }, { data: favouriteRows }] =
    await Promise.all([
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
      userId
        ? supabase.from("favourites").select("resource_id").eq("user_id", userId)
        : Promise.resolve({ data: [] as { resource_id: string }[] }),
    ]);

  const favouriteIds = new Set((favouriteRows ?? []).map((f) => f.resource_id));
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const isEmpty = (resources?.length ?? 0) === 0;

  return (
    <>
      <Suspense>
        <BrowseHero
          navCategories={navCategories}
          activeCategory={categorySlug ?? null}
        />
      </Suspense>

      {/* ── Category scroll row — Envato-style, always visible ── */}
      {scrollRowCats.length > 0 && (
        <div className="border-b border-border bg-muted/20 px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Suspense>
              <CategoryScrollRow
                categories={scrollRowCats}
                activeCategory={categorySlug ?? null}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* ── Two-column layout: sidebar + content ── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="lg:grid lg:grid-cols-[256px_1fr] lg:gap-8">

          {/* Hierarchical filter sidebar — desktop always-on, mobile drawer */}
          <Suspense>
            <CategoryFilterSidebar
              navCategories={navCategories}
              activeCategory={categorySlug ?? null}
              activeChildren3={activeChildren3}
            />
          </Suspense>

          {/* Main column */}
          <div className="min-w-0">
            {!isFiltered && (
              <FeaturedStrip
                resources={featuredResources as ResourceCardData[]}
                favouriteIds={favouriteIds}
                userId={userId}
              />
            )}

            {/* Results header */}
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
                  {/* Mobile filter button + drawer */}
                  <MobileFilterClientWrapper
                    activeCategory={categorySlug ?? null}
                    navCategories={navCategories}
                    activeChildren3={activeChildren3}
                  />

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
        </div>
      </div>
    </>
  );
}

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
