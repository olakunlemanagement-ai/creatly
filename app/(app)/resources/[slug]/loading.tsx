export default function ResourceDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      {/* Breadcrumb placeholder */}
      <div className="mb-6 h-4 w-28 animate-pulse rounded bg-muted" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr] lg:gap-12">
        {/* Gallery skeleton */}
        <div className="flex flex-col gap-3">
          <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-muted" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="size-16 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="flex flex-col gap-5">
          {/* Badges */}
          <div className="flex gap-2">
            <div className="h-6 w-14 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-7 w-1/2 animate-pulse rounded bg-muted" />
          </div>

          {/* Creator */}
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <div className="h-3 w-14 animate-pulse rounded bg-muted" />
              <div className="mt-1.5 h-5 w-16 animate-pulse rounded bg-muted" />
            </div>
            <div>
              <div className="h-3 w-18 animate-pulse rounded bg-muted" />
              <div className="mt-1.5 h-5 w-12 animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Download button */}
          <div className="border-t border-border pt-4">
            <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
