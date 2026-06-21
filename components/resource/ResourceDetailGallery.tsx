"use client";

import { useState } from "react";
import Image from "next/image";
import { getPreviewImageUrl } from "@/lib/storage";

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
  const [activeImage, setActiveImage] = useState(primaryImage);
  const activeUrl = getPreviewImageUrl(activeImage);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={activeUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover transition-opacity duration-200 motion-reduce:transition-none"
          loading="lazy"
        />
      </div>

      {/* Thumbnail strip — only shown when there are additional images */}
      {additionalImages.length > 0 && (
        <ul aria-label="Preview images" className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => {
            const url = getPreviewImageUrl(img);
            const isActive = img === activeImage;
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-label={`Preview image ${i + 1}`}
                  aria-pressed={isActive}
                  onClick={() => setActiveImage(img)}
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
  );
}
