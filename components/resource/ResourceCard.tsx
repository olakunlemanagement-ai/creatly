import Link from "next/link";
import Image from "next/image";
import { Heart, Download } from "lucide-react";
import type { Resource } from "@/types/database";
import { getPreviewImageUrl } from "@/lib/storage";

export type ResourceCardData = Resource & {
  creators: { name: string } | null;
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
  // Fall back to the subtype portion (e.g. "pdf" from "application/pdf")
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
        className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Preview image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={previewUrl}
            alt={resource.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          {/* Favourite heart — UI only; wired in step 1.7 */}
          <div className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            <Heart className="size-3.5" strokeWidth={1.5} />
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-col gap-1.5 p-3">
          {/* File type badge */}
          <span className="inline-flex w-fit items-center rounded-full bg-terracotta-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-terracotta-700">
            {mimeLabel}
          </span>

          {/* Title */}
          <p className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
            {resource.title}
          </p>

          {/* Creator */}
          <p className="truncate text-xs text-muted-foreground">
            by {creatorName}
          </p>

          {/* Download count */}
          {resource.download_count > 0 && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground/70">
              <Download className="size-3" strokeWidth={1.5} />
              {resource.download_count.toLocaleString()}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
