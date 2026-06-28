import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import type { CategoryTileData } from "@/components/resource/CategoryTiles";

interface CategoryBentoProps {
  categories: CategoryTileData[];
}

// Fallback solid-color palette used when no image matches the slug
const TILE_PALETTES = [
  { bg: "bg-brand-green-900",   text: "text-cream-100",  sub: "text-cream-300/60" },
  { bg: "bg-terracotta-700",    text: "text-cream-100",  sub: "text-cream-200/60" },
  { bg: "bg-sand-400",          text: "text-forest-900", sub: "text-forest-900/60" },
  { bg: "bg-brand-green-700",   text: "text-cream-100",  sub: "text-cream-300/60" },
  { bg: "bg-terracotta-500",    text: "text-cream-100",  sub: "text-cream-200/60" },
  { bg: "bg-brand-green-800",   text: "text-cream-100",  sub: "text-cream-300/60" },
] as const;

function getPalette(index: number) {
  return TILE_PALETTES[index % TILE_PALETTES.length]!;
}

const CATEGORY_IMAGES: Record<string, string> = {
  "stock-video":           "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800",
  "video-assets":          "https://images.unsplash.com/photo-1536240478700-b869ad10e128?w=800",
  "stock-music":           "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
  "sound-assets":          "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800",
  "graphic-assets":        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
  "graphics":              "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
  "graphic-elements":      "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800",
  "presentation-assets":   "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800",
  "presentations":         "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800",
  "stock-photos":          "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800",
  "photos":                "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800",
  "fonts":                 "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800",
  "add-ons":               "https://images.unsplash.com/photo-1555066931-4365d14431b9?w=800",
  "web-templates":         "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800",
  "templates":             "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800",
  "3d":                    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
  "mockups":               "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
  "motion-graphics":       "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
  "icons":                 "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800",
  "brand-kits":            "https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=800",
  "social-media":          "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800",
};

function getCategoryImage(slug: string): string | null {
  if (CATEGORY_IMAGES[slug]) return CATEGORY_IMAGES[slug]!;
  const key = Object.keys(CATEGORY_IMAGES).find(
    (k) => slug.includes(k) || k.includes(slug),
  );
  return key ? (CATEGORY_IMAGES[key] ?? null) : null;
}

export function CategoryBento({ categories }: CategoryBentoProps) {
  if (categories.length === 0) return null;

  const [featured, ...rest] = categories;

  return (
    <section className="bg-cream-50 px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {"// Explore by type"}
            </p>
            <h2
              className="mt-3 font-heading text-4xl text-foreground sm:text-5xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Every resource type,
              <br />
              <span className="text-terracotta-600">in one place.</span>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:grid-cols-3 lg:auto-rows-[220px] lg:grid-cols-4">
            {/* Feature tile — spans 2 cols × 2 rows */}
            {featured && (
              <CategoryTile
                category={featured}
                palette={getPalette(0)}
                className="col-span-2 row-span-2"
                featured
                imageUrl={getCategoryImage(featured.slug)}
              />
            )}

            {/* Remaining tiles — 1 col × 1 row */}
            {rest.map((cat, i) => (
              <CategoryTile
                key={cat.id}
                category={cat}
                palette={getPalette(i + 1)}
                imageUrl={getCategoryImage(cat.slug)}
              />
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8">
            <Link
              href="/browse"
              className="group inline-flex items-center gap-1 text-sm font-medium text-terracotta-600 underline-offset-4 hover:underline"
            >
              Browse all resources
              <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

interface Palette {
  bg: string;
  text: string;
  sub: string;
}

function CategoryTile({
  category,
  palette,
  className = "",
  featured = false,
  imageUrl,
}: {
  category: CategoryTileData;
  palette: Palette;
  className?: string;
  featured?: boolean;
  imageUrl?: string | null;
}) {
  return (
    <Link
      href={`/browse?category=${category.slug}`}
      className={[
        "group relative flex flex-col justify-end overflow-hidden rounded-2xl p-5 transition-all duration-200",
        "hover:brightness-110 hover:scale-[1.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring",
        palette.bg,
        className,
      ].join(" ")}
    >
      {/* Background image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Dark overlay when image is present; subtle pattern when not */}
      {imageUrl ? (
        <div className="pointer-events-none absolute inset-0 bg-black/40" />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
            backgroundSize: "8px 8px",
          }}
        />
      )}

      {/* Bottom-left label block */}
      <div className="relative z-10">
        <p
          className={[
            "font-heading font-bold leading-tight",
            featured ? "text-2xl sm:text-3xl" : "text-base sm:text-lg",
            imageUrl ? "text-white" : palette.text,
          ].join(" ")}
          style={{ letterSpacing: "-0.01em" }}
        >
          {category.name}
        </p>
        {typeof category.resource_count === "number" && (
          <p
            className={`mt-1 text-xs font-medium ${imageUrl ? "text-white/70" : palette.sub}`}
          >
            {category.resource_count.toLocaleString()}{" "}
            {category.resource_count === 1 ? "resource" : "resources"}
          </p>
        )}
      </div>
    </Link>
  );
}
