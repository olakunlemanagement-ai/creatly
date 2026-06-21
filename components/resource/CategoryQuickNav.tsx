import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryQuickNavProps {
  categories: Category[];
}

export function CategoryQuickNav({ categories }: CategoryQuickNavProps) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Browse by category" className="py-6">
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => (
          // TODO 1.5: wire real category filter query
          <Link
            key={cat.id}
            href={`/browse?category=${cat.slug}`}
            className="whitespace-nowrap rounded-full border border-border bg-card px-4 py-1.5 text-sm text-foreground transition-colors hover:border-terracotta-400 hover:text-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
