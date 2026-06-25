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

const PAGE_SIZE = 24;

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
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
          {/* Grid layout matching Figma "My Downloads" */}
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6">
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
                <li key={dl.id} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                  {/* Thumbnail */}
                  <Link
                    href={`/resources/${resource.slug}`}
                    className="relative block aspect-square overflow-hidden bg-muted"
                  >
                    <Image
                      src={previewUrl}
                      alt={resource.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 16vw"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <Link
                      href={`/resources/${resource.slug}`}
                      className="line-clamp-2 text-xs font-semibold text-foreground hover:text-brand-green-700 leading-snug"
                    >
                      {resource.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      {categoryName && (
                        <span className="text-[10px] text-muted-foreground truncate">{categoryName}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-auto">
                      {formatDate(dl.downloaded_at)}
                    </p>
                    <div className="mt-1.5">
                      <ReDownloadButton
                        resourceId={resource.id}
                        fileName={resource.file_name}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

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
