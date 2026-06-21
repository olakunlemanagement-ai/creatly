"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Dialog as DialogPrimitive } from "radix-ui"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResourcePreviewLightboxProps {
  /** Fully resolved image URLs (via getPreviewImageUrl). */
  images: string[]
  initialIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResourcePreviewLightbox({
  images,
  initialIndex,
  open,
  onOpenChange,
}: ResourcePreviewLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)
  const isSingle = images.length <= 1

  // Reset to the gallery's active image each time the lightbox opens.
  useEffect(() => {
    if (open) setCurrentIndex(initialIndex)
  }, [open, initialIndex])

  const prev = useCallback(() => {
    setCurrentIndex(i => (i - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback(() => {
    setCurrentIndex(i => (i + 1) % images.length)
  }, [images.length])

  // Arrow-key navigation — listener attached only while the lightbox is open.
  useEffect(() => {
    if (!open || isSingle) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, isSingle, prev, next])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    // 40px threshold so taps don't accidentally trigger navigation.
    if (Math.abs(delta) > 40) {
      if (delta > 0) {
        prev()
      } else {
        next()
      }
    }
    touchStartX.current = null
  }

  if (images.length === 0) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Dark fullscreen backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none" />

        {/* Fullscreen content panel */}
        <DialogPrimitive.Content
          aria-label={
            isSingle
              ? "Resource preview"
              : `Resource preview, image ${currentIndex + 1} of ${images.length}`
          }
          className="fixed inset-0 z-50 flex flex-col bg-transparent outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none"
          onTouchStart={isSingle ? undefined : onTouchStart}
          onTouchEnd={isSingle ? undefined : onTouchEnd}
        >
          {/* Visually hidden title + description satisfy Radix's a11y requirements */}
          <DialogPrimitive.Title className="sr-only">Resource preview</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {isSingle
              ? "Fullscreen preview of the resource image."
              : "Browse preview images with arrow keys, on-screen buttons, or swipe."}
          </DialogPrimitive.Description>

          {/* ── Top bar: counter + close ── */}
          <div className="flex flex-none items-center justify-between px-4 py-3">
            {!isSingle ? (
              <span className="text-sm font-medium tabular-nums text-white/80">
                {currentIndex + 1} / {images.length}
              </span>
            ) : (
              <span />
            )}
            <DialogPrimitive.Close
              aria-label="Close preview"
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          {/* ── Main image ── */}
          <div className="relative flex flex-1 items-center justify-center px-12">
            {/* Prev arrow */}
            {!isSingle && (
              <button
                type="button"
                onClick={prev}
                aria-label="Previous image"
                className="absolute left-2 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            {/* Image — object-contain so the full preview is always visible, never cropped */}
            <div className="relative h-full w-full">
              <Image
                src={images[currentIndex]}
                alt={`Preview image ${currentIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {/* Next arrow */}
            {!isSingle && (
              <button
                type="button"
                onClick={next}
                aria-label="Next image"
                className="absolute right-2 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </div>

          {/* ── Thumbnail strip ── hidden for single-image resources */}
          {!isSingle && (
            <div
              aria-label="Image thumbnails"
              className="flex flex-none gap-2 overflow-x-auto px-4 py-3"
            >
              {images.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  aria-pressed={i === currentIndex}
                  className={cn(
                    "relative size-14 flex-none overflow-hidden rounded-md border-2 transition-all motion-reduce:transition-none",
                    i === currentIndex
                      ? "border-brand-green-500 ring-2 ring-brand-green-400 ring-offset-1 ring-offset-black"
                      : "border-white/20 opacity-60 hover:opacity-100",
                  )}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${i + 1}`}
                    fill
                    sizes="56px"
                    className="object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
