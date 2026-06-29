import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { History } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPreviewImageUrl } from "@/lib/storage";
import { ClearHistoryButton } from "./ClearHistoryButton";

export const metadata: Metadata = {
  title: `Recently Viewed — ${APP_NAME}`,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function RecentlyViewedPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/dashboard/recently-viewed");

  const supabase = await createClient();

  const { data: viewRows } = await supabase
    .from("recently_viewed")
    .select(
      `
      id,
      viewed_at,
      resource_id,
      resources (
        id,
        title,
        slug,
        preview_image_path,
        file_type,
        categories ( name )
      )
    `,
    )
    .eq("user_id", auth.user.id)
    .order("viewed_at", { ascending: false })
    .limit(10);

  const views = viewRows ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
            Recently Viewed
          </h1>
          {views.length > 0 && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {views.length}
            </span>
          )}
        </div>
        {views.length > 0 && (
          <ClearHistoryButton userId={auth.user.id} />
        )}
      </div>

      {views.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <History className="size-10 text-muted-foreground/40" strokeWidth={1} />
          <p className="text-base text-muted-foreground">
            No recently viewed resources yet — start browsing.
          </p>
          <Link
            href="/browse"
            className="text-sm font-medium text-brand-green-700 underline underline-offset-2 hover:text-brand-green-800"
          >
            Browse the library →
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
          {views.map((row) => {
            const resource = Array.isArray(row.resources)
              ? row.resources[0]
              : row.resources;
            if (!resource) return null;

            const categoryName = Array.isArray(resource.categories)
              ? resource.categories[0]?.name
              : (resource.categories as { name: string } | null)?.name;

            const previewUrl = getPreviewImageUrl(resource.preview_image_path);

            return (
              <li
                key={row.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card"
              >
                <Link
                  href={`/resources/${resource.slug}`}
                  className="relative block aspect-square overflow-hidden bg-muted"
                >
                  <Image
                    src={previewUrl}
                    alt={resource.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                </Link>
                <div className="flex flex-1 flex-col gap-1 p-2.5">
                  <Link
                    href={`/resources/${resource.slug}`}
                    className="line-clamp-2 text-xs font-semibold leading-snug text-foreground hover:text-brand-green-700"
                  >
                    {resource.title}
                  </Link>
                  {categoryName && (
                    <span className="text-[10px] text-muted-foreground">
                      {categoryName}
                    </span>
                  )}
                  <p className="mt-auto text-[10px] text-muted-foreground">
                    Viewed {formatDate(row.viewed_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
