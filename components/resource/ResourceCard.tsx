import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import type { Resource } from "@/types/database";
import { getPreviewImageUrl } from "@/lib/storage";

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
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const previewUrl = getPreviewImageUrl(resource.preview_image_path);
  const mimeLabel = getMimeLabel(resource.file_type);
  const creatorName = resource.creators?.name ?? "Unknown creator";

  return (
    <li>
      <Link
        href={`/resources/${resource.slug}`}
        className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Preview image — 4:3 ratio feels richer than 16:9 for creative assets */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <Image
            src={previewUrl}
            alt={resource.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
            loading="lazy"
          />
          {/* Favourite heart — UI only; wired in step 1.7 */}
          <div className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100 motion-reduce:transition-none">
            <Heart className="size-3.5" strokeWidth={1.5} />
          </div>
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
