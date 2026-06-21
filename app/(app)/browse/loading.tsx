import { ResourceGrid } from "@/components/resource/ResourceGrid";
import { ResourceCardSkeleton } from "@/components/resource/ResourceCardSkeleton";

const SKELETON_COUNT = 24;

export default function BrowseLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page header skeleton */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
      </div>

      <ResourceGrid>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <ResourceCardSkeleton key={i} />
        ))}
      </ResourceGrid>
    </div>
  );
}
