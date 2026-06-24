import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPreviewImageUrl } from "@/lib/storage";
import { ReDownloadButton } from "./DownloadRowClient";

export const metadata: Metadata = {
  title: `Downloads — ${APP_NAME}`,
};

const PAGE_SIZE = 12;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface SearchParams {
  page?: string;
}

export default async function DownloadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/dashboard/downloads");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const { data: downloads, count } = await supabase
    .from("downloads")
    .select(
      `
      id,
      downloaded_at,
      resource_id,
      resources (
        id,
        title,
        preview_image_path,
        file_type,
        file_name,
        slug,
        categories ( name )
      )
    `,
      { count: "exact" },
    )
    .eq("user_id", auth.user.id)
    .order("downloaded_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex items-center gap-3">
        <Download className="h-5 w-5 text-muted-foreground" />
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          Downloads
        </h1>
        {count !== null && count > 0 && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {count}
          </span>
        )}
      </div>

      {!downloads || downloads.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Download className="size-10 text-muted-foreground/40" strokeWidth={1} />
          <p className="text-base text-muted-foreground">No downloads yet.</p>
          <Link
            href="/browse"
            className="text-sm font-medium text-brand-green-700 underline underline-offset-2 hover:text-brand-green-800"
          >
            Browse the library →
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border rounded-2xl border border-border">
            {downloads.map((dl) => {
              const resource = Array.isArray(dl.resources)
                ? dl.resources[0]
                : dl.resources;
              if (!resource) return null;

              const categoryName = Array.isArray(resource.categories)
                ? resource.categories[0]?.name
                : (resource.categories as { name: string } | null)?.name;

              const previewUrl = getPreviewImageUrl(resource.preview_image_path);

              return (
                <div
                  key={dl.id}
                  className="flex items-center gap-4 px-4 py-4 sm:px-5"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/resources/${resource.slug}`}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted"
                    tabIndex={-1}
                  >
                    <Image
                      src={previewUrl}
                      alt={resource.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </Link>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/resources/${resource.slug}`}
                      className="block truncate text-sm font-semibold text-foreground hover:text-brand-green-700"
                    >
                      {resource.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      {categoryName && (
                        <span className="text-xs text-muted-foreground">{categoryName}</span>
                      )}
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {resource.file_type?.split("/")[1]?.toUpperCase() ?? "FILE"}
                      </span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        · {formatDate(dl.downloaded_at)}
                      </span>
                    </div>
                  </div>

                  {/* Re-download */}
                  <div className="shrink-0">
                    <ReDownloadButton
                      resourceId={resource.id}
                      fileName={resource.file_name}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/downloads?page=${page - 1}`}
                  className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/dashboard/downloads?page=${page + 1}`}
                  className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
