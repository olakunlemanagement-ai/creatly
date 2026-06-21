import { Layers } from "lucide-react";

export function CatalogueEmptyState() {
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
