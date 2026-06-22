import Link from "next/link";
import Image from "next/image";
import type { Resource } from "@/types/database";
import { getPreviewImageUrl } from "@/lib/storage";
import { FavouriteButton } from "./FavouriteButton";

export type ResourceCardData = Resource & {
  creators: { name: string } | null;
  categories: { name: string; slug: string } | null;
};

/** Derives a short display label from a MIME type string. */
function getMimeLabel(mimeType: string): string {
  const map: Record<string, string> = {
    "application/zip": "ZIP",
    "application/x-zip-compressed": "ZIP",
    "application/x-figma": "FIGMA",
    "image/vnd.adobe.photoshop": "PSD",
    "application/illustrator": "AI",
    "application/x-coreldraw": "CDR",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "PPTX",
    "video/mp4": "MP4",
    "video/quicktime": "MOV",
    "font/ttf": "TTF",
    "font/otf": "OTF",
    "font/woff": "WOFF",
    "font/woff2": "WOFF2",
    "image/svg+xml": "SVG",
    "image/png": "PNG",
    "image/jpeg": "JPG",
  };
  if (map[mimeType]) return map[mimeType];
  const sub = mimeType.split("/")[1];
  return sub ? sub.split(/[+.-]/)[0].toUpperCase() : "FILE";
}

interface ResourceCardProps {
  resource: ResourceCardData;
  isFavourited?: boolean;
  userId?: string | null;
}

export function ResourceCard({
  resource,
  isFavourited = false,
  userId = null,
}: ResourceCardProps) {
  const previewUrl = getPreviewImageUrl(resource.preview_image_path);
  const mimeLabel = getMimeLabel(resource.file_type);
  const creatorName = resource.creators?.name ?? "Unknown creator";

  return (
    // group lives on <li> so both the image zoom and the heart overlay respond to hover on the card.
    // FavouriteButton is positioned outside <Link> to avoid nesting a <button> inside an <a>.
    <li className="group relative">
      {/* Heart — always visible when saved; appears on hover when not saved */}
      <div
        className={`absolute right-2 top-2 z-10 transition-opacity duration-150 motion-reduce:transition-none ${
          isFavourited ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <FavouriteButton
          resourceId={resource.id}
          resourceSlug={resource.slug}
          isFavourited={isFavourited}
          userId={userId}
          variant="card"
        />
      </div>

      <Link
        href={`/resources/${resource.slug}`}
        className="block overflow-hidden rounded-xl border border-border bg-card transition-[transform,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_4px_20px_-4px_oklch(0.17_0.015_270_/_0.12),0_2px_8px_-2px_oklch(0.17_0.015_270_/_0.08)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Preview image — 4:3 ratio feels richer than 16:9 for creative assets */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <Image
            src={previewUrl}
            alt={resource.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] motion-reduce:transition-none"
            loading="lazy"
          />
        </div>

        {/* Card body */}
        <div className="flex flex-col gap-1.5 p-3">
          {/* Badges row: file type + category */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-terracotta-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-terracotta-700">
              {mimeLabel}
            </span>
            {resource.categories?.name && (
              <span className="inline-flex items-center rounded-full bg-brand-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-green-700">
                {resource.categories.name}
              </span>
            )}
          </div>

          {/* Title */}
          <p className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
            {resource.title}
          </p>

          {/* Creator */}
          <p className="truncate text-xs text-muted-foreground">
            by {creatorName}
          </p>
        </div>
      </Link>
    </li>
  );
}
