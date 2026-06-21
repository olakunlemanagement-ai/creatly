export function ResourceCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Preview image area — matches aspect-[4/3] of the real card */}
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />

      {/* Card body */}
      <div className="flex flex-col gap-2 p-3">
        {/* Badge row — two badge placeholders (file type + category) */}
        <div className="flex gap-1.5">
          <div className="h-4 w-10 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
        </div>
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
