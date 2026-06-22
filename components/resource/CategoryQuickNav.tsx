"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryQuickNavProps {
  categories: Category[];
  activeCategory: string | null;
}

export function CategoryQuickNav({ categories, activeCategory }: CategoryQuickNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (categories.length === 0) return null;

  function handleClick(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (activeCategory === slug) {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`/browse?${params.toString()}`);
    });
  }

  return (
    <nav aria-label="Browse by category" className="py-6">
      {/* Negative margin lets pills scroll edge-to-edge without the container clipping the first pill */}
      <div
        className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 transition-opacity duration-150 sm:-mx-6 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isPending ? "opacity-60" : ""}`}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => handleClick(cat.slug)}
              aria-pressed={isActive}
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none ${
                isActive
                  ? "border-terracotta-500 bg-terracotta-500 text-white"
                  : "border-border bg-card text-foreground hover:border-terracotta-400 hover:text-terracotta-600"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
