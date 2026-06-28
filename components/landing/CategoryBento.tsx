import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import type { CategoryTileData } from "@/components/resource/CategoryTiles";

interface CategoryBentoProps {
  categories: CategoryTileData[];
}

// Rotates through on-brand palette: forest, terracotta, sand, cream-deep, olive
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
              />
            )}

            {/* Remaining tiles — 1 col × 1 row */}
            {rest.map((cat, i) => (
              <CategoryTile
                key={cat.id}
                category={cat}
                palette={getPalette(i + 1)}
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
}: {
  category: CategoryTileData;
  palette: Palette;
  className?: string;
  featured?: boolean;
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
      {/* Subtle diagonal pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
          backgroundSize: "8px 8px",
        }}
      />

      {/* Bottom-left label block */}
      <div className="relative z-10">
        <p
          className={[
            "font-heading font-bold leading-tight",
            featured ? "text-2xl sm:text-3xl" : "text-base sm:text-lg",
            palette.text,
          ].join(" ")}
          style={{ letterSpacing: "-0.01em" }}
        >
          {category.name}
        </p>
        {typeof category.resource_count === "number" && (
          <p className={`mt-1 text-xs font-medium ${palette.sub}`}>
            {category.resource_count.toLocaleString()}{" "}
            {category.resource_count === 1 ? "resource" : "resources"}
          </p>
        )}
      </div>
    </Link>
  );
}
