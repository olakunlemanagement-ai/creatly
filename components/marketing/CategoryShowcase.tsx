import Link from "next/link";
import { Reveal } from "@/components/shared/Reveal";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryShowcaseProps {
  categories: Category[];
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-cream-100 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
              Browse by category
            </h2>
            <p className="mt-3 text-muted-foreground">
              Find exactly what your project needs.
            </p>
          </div>
        </Reveal>

        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          role="list"
        >
          {categories.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 40}>
              <Link
                href={`/browse?category=${cat.slug}`}
                role="listitem"
                className="flex items-center justify-center rounded-xl border border-border bg-card px-4 py-5 text-center text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-terracotta-400 hover:text-terracotta-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
              >
                {cat.name}
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={80}>
          <div className="mt-8 text-center">
            <Link
              href="/browse"
              className="text-sm font-medium text-primary transition-colors duration-150 hover:text-brand-green-700 motion-reduce:transition-none"
            >
              View all resources →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
