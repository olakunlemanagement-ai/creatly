"use client";

import { useState, useRef, useCallback } from "react";
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
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
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

const MAX_TILT = 8; // degrees

export function ResourceCard({
  resource,
  isFavourited = false,
  userId = null,
}: ResourceCardProps) {
  const previewUrl = getPreviewImageUrl(resource.preview_image_path);
  const mimeLabel = getMimeLabel(resource.file_type);
  const creatorName = resource.creators?.name ?? "Unknown creator";

  const cardRef = useRef<HTMLLIElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    if (prefersReduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (relY - 0.5) * -MAX_TILT * 2,
      y: (relX - 0.5) *  MAX_TILT * 2,
    });
    setShine({ x: relX * 100, y: relY * 100 });
  }, [prefersReduced]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  const tiltStyle = prefersReduced ? {} : {
    transform: isHovering
      ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
      : "perspective(800px) rotateX(0deg) rotateY(0deg)",
    transition: isHovering ? "none" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: isHovering ? "transform" : "auto",
  };

  return (
    <li
      ref={cardRef}
      className="group relative"
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Heart — fades + scales in on hover; always visible when saved */}
      <div
        className={[
          "absolute right-2 top-2 z-10 transition-all duration-150 motion-reduce:transition-none",
          isFavourited
            ? "scale-100 opacity-100"
            : "scale-[0.8] opacity-0 group-hover:scale-100 group-hover:opacity-100",
        ].join(" ")}
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
        className="relative block overflow-hidden rounded-xl border border-border bg-card transition-[box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_4px_20px_-4px_oklch(0.17_0.015_270_/_0.12),0_2px_8px_-2px_oklch(0.17_0.015_270_/_0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Mouse-tracked shine overlay */}
        {isHovering && !prefersReduced && (
          <span
            className="pointer-events-none absolute inset-0 z-10 rounded-xl"
            aria-hidden="true"
            style={{
              background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
            }}
          />
        )}

        {/* Preview image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <Image
            src={previewUrl}
            alt={resource.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] motion-reduce:transition-none"
            loading="lazy"
          />
        </div>

        {/* Card body */}
        <div className="flex flex-col gap-1.5 p-3">
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
          <p className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
            {resource.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">by {creatorName}</p>
        </div>
      </Link>
    </li>
  );
}
