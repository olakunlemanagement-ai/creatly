import Link from "next/link";
import {
  LayoutTemplate,
  Type,
  Package,
  Layers,
  Image,
  Video,
  Palette,
  Grid3X3,
  FileText,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CategoryTileData = {
  id: string;
  name: string;
  slug: string;
  resource_count?: number;
};

interface CategoryTilesProps {
  categories: CategoryTileData[];
  activeCategory?: string | null;
  className?: string;
}

// Map category slugs (or partial names) to icons
const ICON_MAP: Record<string, LucideIcon> = {
  templates: LayoutTemplate,
  template: LayoutTemplate,
  fonts: Type,
  font: Type,
  mockups: Package,
  mockup: Package,
  graphics: Image,
  graphic: Image,
  "motion-graphics": Video,
  motion: Video,
  video: Video,
  presentations: LayoutTemplate,
  presentation: LayoutTemplate,
  icons: Grid3X3,
  icon: Grid3X3,
  "brand-kits": Palette,
  brand: Palette,
  "social-media": Layers,
  social: Layers,
  documents: FileText,
  document: FileText,
};

function getIcon(slug: string): LucideIcon {
  const key = Object.keys(ICON_MAP).find(
    (k) => slug.includes(k) || k.includes(slug),
  );
  return key ? ICON_MAP[key]! : Star;
}

export function CategoryTiles({
  categories,
  activeCategory,
  className = "",
}: CategoryTilesProps) {
  if (categories.length === 0) return null;

  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {categories.map((cat) => {
        const Icon = getIcon(cat.slug);
        const isActive = activeCategory === cat.slug;

        return (
          <Link
            key={cat.id}
            href={`/browse?category=${cat.slug}`}
            className={`group flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-terracotta-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? "border-2 border-terracotta-500 bg-terracotta-500/5"
                : "border-border bg-card"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200 ${
                isActive
                  ? "bg-terracotta-500/15 text-terracotta-600"
                  : "bg-muted text-muted-foreground group-hover:bg-terracotta-500/10 group-hover:text-terracotta-600"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p
                className={`truncate font-semibold leading-tight transition-colors duration-150 ${
                  isActive
                    ? "text-terracotta-600"
                    : "text-foreground group-hover:text-terracotta-600"
                }`}
              >
                {cat.name}
              </p>
              {typeof cat.resource_count === "number" && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {cat.resource_count.toLocaleString()}{" "}
                  {cat.resource_count === 1 ? "resource" : "resources"}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
