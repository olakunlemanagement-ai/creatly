import Link from "next/link";
import { Layers, SearchX } from "lucide-react";

interface CatalogueEmptyStateProps {
  variant?: "cold-start" | "search-empty";
}

export function CatalogueEmptyState({ variant = "cold-start" }: CatalogueEmptyStateProps) {
  if (variant === "search-empty") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <SearchX className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
        <p className="text-base font-medium text-foreground">No resources match your search</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Try different keywords, or browse everything.
        </p>
        <Link
          href="/browse"
          className="mt-1 text-sm font-medium text-terracotta-600 underline underline-offset-2 hover:text-terracotta-700"
        >
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <Layers className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
      <p className="text-base font-medium text-foreground">No resources yet</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        New creative assets are added regularly — check back soon.
      </p>
    </div>
  );
}
