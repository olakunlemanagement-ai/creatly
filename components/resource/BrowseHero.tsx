"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { NavCategory } from "@/components/nav/SiteHeader";

interface BrowseHeroProps {
  navCategories: NavCategory[];
  activeCategory: string | null;
}

export function BrowseHero({ navCategories, activeCategory }: BrowseHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function navigate(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!slug) {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`/browse?${params.toString()}`);
    });
  }

  // Determine which level-1 category is active (either directly or via a child)
  const activeRoot = navCategories.find(
    (cat) =>
      cat.slug === activeCategory ||
      cat.children.some((c) => c.slug === activeCategory),
  );

  // Sub-category pills shown when a root with children is active
  const activeChildren = activeRoot?.children ?? [];

  return (
    <section
      className="px-4 pt-3 pb-12 sm:px-6 sm:pt-4 sm:pb-16"
      style={{
        background:
          "radial-gradient(ellipse at 65% 0%, oklch(0.33 0.10 148), oklch(0.20 0.07 148))",
      }}
    >
      <div className="mx-auto max-w-7xl mb-3 sm:mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-cream-200/70 transition-colors hover:text-cream-100"
        >
          <ChevronLeft className="size-3.5" />
          Home
        </Link>
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <h1
          className="hero-animate font-heading text-3xl leading-tight text-cream-100 sm:text-5xl"
          style={{
            animationDuration: "500ms",
            animationFillMode: "both",
            animationName: "hero-in",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          Unlimited downloads for{" "}
          <span className="text-terracotta-300">African creatives</span>
        </h1>
        <p
          className="hero-animate mt-4 text-base text-cream-200 sm:text-lg"
          style={{
            animationDuration: "500ms",
            animationDelay: "80ms",
            animationFillMode: "both",
            animationName: "hero-in",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          One subscription. Every template, font, mockup, and motion asset you need.
        </p>

        {navCategories.length > 0 && (
          <div
            className="hero-animate mt-8 space-y-3"
            style={{
              animationDuration: "500ms",
              animationDelay: "160ms",
              animationFillMode: "both",
              animationName: "hero-in",
              animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Level-1 main category pills */}
            <nav
              aria-label="Browse by category"
              className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-0 sm:flex-wrap sm:justify-center transition-opacity duration-150 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isPending ? "opacity-60" : ""}`}
            >
              {navCategories.map((cat) => {
                const isActive =
                  activeCategory === cat.slug ||
                  cat.children.some((c) => c.slug === activeCategory);
                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      isActive && activeCategory === cat.slug
                        ? navigate(null)
                        : navigate(cat.slug)
                    }
                    aria-pressed={isActive}
                    className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 motion-reduce:transition-none ${
                      isActive
                        ? "border-terracotta-400 bg-terracotta-500 text-white"
                        : "border-white/20 bg-white/10 text-cream-100 hover:border-terracotta-400 hover:bg-white/20"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </nav>

            {/* Level-2 sub-category pills — visible when a root with children is selected */}
            {activeChildren.length > 0 && (
              <nav
                aria-label={`Browse ${activeRoot?.name} sub-categories`}
                className={`-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-0 sm:flex-wrap sm:justify-center transition-opacity duration-150 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isPending ? "opacity-60" : ""}`}
              >
                {activeChildren.map((child) => {
                  const isChildActive = activeCategory === child.slug;
                  return (
                    <button
                      key={child.id}
                      onClick={() =>
                        isChildActive ? navigate(activeRoot!.slug) : navigate(child.slug)
                      }
                      aria-pressed={isChildActive}
                      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 motion-reduce:transition-none ${
                        isChildActive
                          ? "border-white/60 bg-white/20 text-white"
                          : "border-white/10 bg-transparent text-cream-200/80 hover:border-white/30 hover:text-cream-100"
                      }`}
                    >
                      {child.name}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
