"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  LayoutTemplate,
  Type,
  Package,
  Layers,
  Image,
  Video,
  Music,
  Volume2,
  Globe,
  Monitor,
  Box,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CategoryScrollItem = {
  id: string;
  name: string;
  slug: string;
  resource_count?: number;
  children?: { id: string; name: string; slug: string }[];
};

interface CategoryScrollRowProps {
  categories: CategoryScrollItem[];
  activeCategory: string | null;
}

// Map new Envato-aligned slugs to icons
const ICON_MAP: Record<string, LucideIcon> = {
  "graphic-templates": LayoutTemplate,
  "video":             Video,
  "music":             Music,
  "sound-effects":     Volume2,
  "photos":            Image,
  "fonts":             Type,
  "add-ons":           Package,
  "web-templates":     Globe,
  "presentations":     Monitor,
  "3d":                Box,
  "graphic-elements":  Layers,
};

function getIcon(slug: string): LucideIcon {
  return ICON_MAP[slug] ?? Star;
}

export function CategoryScrollRow({
  categories,
  activeCategory,
}: CategoryScrollRowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  function navigate(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!slug || slug === activeCategory) {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`/browse?${params.toString()}`);
    });
  }

  // Active level-1 category and its children
  const activeCat = categories.find((c) => {
    if (c.slug === activeCategory) return true;
    return c.children?.some((ch) => ch.slug === activeCategory);
  });

  const subCats = activeCat?.children ?? [];
  const showSubCats = subCats.length > 0;

  return (
    <div className={`transition-opacity duration-150 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Horizontal scroll row */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
        style={{ scrollPaddingLeft: "1rem" }}
        aria-label="Browse by category"
      >
        {categories.map((cat) => {
          const Icon = getIcon(cat.slug);
          const isActive =
            cat.slug === activeCategory ||
            cat.slug === activeCat?.slug;

          return (
            <button
              key={cat.id}
              onClick={() => navigate(cat.slug)}
              className={[
                "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-terracotta-600 bg-terracotta-600 text-cream-100 shadow-sm"
                  : "border-border bg-card text-foreground hover:border-terracotta-400 hover:text-terracotta-600",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{cat.name}</span>
              {typeof cat.resource_count === "number" && (
                <span
                  className={`ml-0.5 text-xs ${
                    isActive ? "text-cream-200/70" : "text-muted-foreground"
                  }`}
                >
                  {cat.resource_count.toLocaleString()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-category filter chips — shown when a level-1 is active and has children */}
      {showSubCats && (
        <div className="mt-3 flex flex-wrap gap-2">
          {subCats.map((sub) => {
            const isSubActive = sub.slug === activeCategory;
            return (
              <button
                key={sub.id}
                onClick={() => navigate(isSubActive ? (activeCat?.slug ?? null) : sub.slug)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSubActive
                    ? "border-brand-green-700 bg-brand-green-700 text-cream-100"
                    : "border-border bg-muted text-foreground hover:border-brand-green-400 hover:text-brand-green-700",
                ].join(" ")}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
