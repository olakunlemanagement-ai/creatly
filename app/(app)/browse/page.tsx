import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { ResourceCard, type ResourceCardData } from "@/components/resource/ResourceCard";
import { ResourceGrid } from "@/components/resource/ResourceGrid";
import { CatalogueEmptyState } from "@/components/resource/CatalogueEmptyState";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: `Browse resources — ${APP_NAME}`,
};

const PAGE_SIZE = 24;

interface BrowsePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const { data: resources, count } = await supabase
    .from("resources")
    .select("*, creators(name)", { count: "exact" })
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const isEmpty = (resources?.length ?? 0) === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Browse resources</h1>
        {totalCount > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount.toLocaleString()} resource{totalCount !== 1 ? "s" : ""} available
          </p>
        )}
      </div>

      {isEmpty && page === 1 ? (
        <CatalogueEmptyState />
      ) : (
        <>
          <ResourceGrid>
            {(resources as ResourceCardData[]).map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </ResourceGrid>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                asChild={page > 1}
                disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                aria-label="Previous page"
              >
                {page > 1 ? (
                  <Link href={`/browse?page=${page - 1}`}>
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
                  <Link href={`/browse?page=${page + 1}`}>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
