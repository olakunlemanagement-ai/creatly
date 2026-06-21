"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { getPreviewImageUrl } from "@/lib/storage";
import { ResourcePreviewLightbox } from "./ResourcePreviewLightbox";

interface ResourceDetailGalleryProps {
  primaryImage: string;
  additionalImages: string[];
  title: string;
}

export function ResourceDetailGallery({
  primaryImage,
  additionalImages,
  title,
}: ResourceDetailGalleryProps) {
  const allImages = [primaryImage, ...additionalImages];
  const resolvedUrls = allImages.map(getPreviewImageUrl);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeUrl = resolvedUrls[activeIndex];

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
          <Image
            src={activeUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-opacity duration-200 motion-reduce:transition-none"
            loading="lazy"
          />
          {/*
           * Preview button:
           * - Mobile / touch (< lg): always visible so touch users can discover it.
           * - Desktop (lg+): hidden until hover, then revealed via group-hover.
           * - Keyboard: always reachable via focus-visible.
           */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Open fullscreen preview"
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-opacity duration-150 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none lg:opacity-0 lg:group-hover:opacity-100"
          >
            <Maximize2 className="size-3.5" />
            Preview
          </button>
        </div>

        {/* Thumbnail strip — only shown when there are additional images */}
        {additionalImages.length > 0 && (
          <ul aria-label="Preview images" className="flex gap-2 overflow-x-auto pb-1">
            {allImages.map((_, i) => {
              const url = resolvedUrls[i];
              const isActive = i === activeIndex;
              return (
                <li key={i}>
                  <button
                    type="button"
                    aria-label={`Preview image ${i + 1}`}
                    aria-pressed={isActive}
                    onClick={() => setActiveIndex(i)}
                    className={[
                      "relative block size-16 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-150 motion-reduce:transition-none",
                      isActive
                        ? "border-brand-green-600 ring-2 ring-brand-green-300"
                        : "border-border hover:border-brand-green-400",
                    ].join(" ")}
                  >
                    <Image
                      src={url}
                      alt={`Preview ${i + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ResourcePreviewLightbox
        images={resolvedUrls}
        initialIndex={activeIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  );
}
