export function ResourceCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Preview image area */}
      <div className="aspect-video w-full animate-pulse bg-muted" />

      {/* Card body */}
      <div className="flex flex-col gap-2 p-3">
        {/* Badge placeholder */}
        <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
        {/* Title placeholder — two lines */}
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        </div>
        {/* Creator placeholder */}
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </li>
  );
}
