import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { CategoryTiles, type CategoryTileData } from "@/components/resource/CategoryTiles";

interface CategoryBentoProps {
  categories: CategoryTileData[];
}

export function CategoryBento({ categories }: CategoryBentoProps) {
  if (categories.length === 0) return null;

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
              style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
            >
              Every resource type,
              <br />
              <span className="text-terracotta-600">in one place.</span>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <CategoryTiles categories={categories} />
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
