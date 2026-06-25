"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { NavCategory } from "@/components/nav/SiteHeader";

interface CategoryFilterSidebarProps {
  navCategories: NavCategory[];
  activeCategory: string | null;
  // Level-3 children of the active level-2 category (for Stock Music facet values)
  activeChildren3: { id: string; name: string; slug: string }[];
}

function SidebarContent({
  navCategories,
  activeCategory,
  activeChildren3,
}: CategoryFilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(() => {
    // Auto-expand the parent of the active category on mount
    const initial = new Set<string>();
    for (const cat of navCategories) {
      if (
        cat.slug === activeCategory ||
        cat.children.some((c) => c.slug === activeCategory)
      ) {
        initial.add(cat.slug);
      }
    }
    return initial;
  });

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

  function toggleExpand(slug: string) {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  return (
    <div className={`transition-opacity duration-150 ${isPending ? "opacity-60" : ""}`}>
      {activeCategory && (
        <button
          onClick={() => navigate(null)}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-terracotta-300 hover:text-terracotta-600"
        >
          <X className="size-3" />
          Clear filter
        </button>
      )}

      <ul className="space-y-0.5">
        {navCategories.map((cat) => {
          const isRootActive =
            activeCategory === cat.slug ||
            cat.children.some((c) => c.slug === activeCategory);
          const isExpanded = expandedSlugs.has(cat.slug);
          const hasChildren = cat.children.length > 0;

          return (
            <li key={cat.id}>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(cat.slug === activeCategory ? null : cat.slug)}
                  className={[
                    "flex-1 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                    isRootActive
                      ? "bg-brand-green-50 text-brand-green-700"
                      : "text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {cat.name}
                </button>
                {hasChildren && (
                  <button
                    onClick={() => toggleExpand(cat.slug)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? "Collapse" : "Expand"} ${cat.name}`}
                    className="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ChevronDown
                      className={`size-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>

              {/* Level-2 children */}
              {hasChildren && isExpanded && (
                <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3">
                  {cat.children.map((child) => {
                    const isChildActive = activeCategory === child.slug;
                    return (
                      <li key={child.id}>
                        <button
                          onClick={() =>
                            navigate(isChildActive ? cat.slug : child.slug)
                          }
                          className={[
                            "w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                            isChildActive
                              ? "font-semibold text-brand-green-700"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          ].join(" ")}
                        >
                          {child.name}
                        </button>

                        {/* Level-3 values (e.g. Stock Music facet values) */}
                        {isChildActive && activeChildren3.length > 0 && (
                          <ul className="ml-2 mt-0.5 space-y-0.5 border-l border-border pl-2">
                            {activeChildren3.map((val) => (
                              <li key={val.id}>
                                <Link
                                  href={`/browse?category=${val.slug}`}
                                  className="block rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                  {val.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Desktop sidebar — always visible
export function CategoryFilterSidebar(props: CategoryFilterSidebarProps) {
  return (
    <aside className="hidden lg:block" aria-label="Filter by category">
      <div className="sticky top-36 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Categories
        </h2>
        <SidebarContent {...props} />
      </div>
    </aside>
  );
}

// Mobile filter drawer — toggled by a button
export function MobileFilterDrawer(
  props: CategoryFilterSidebarProps & { open: boolean; onClose: () => void },
) {
  const { open, onClose, ...rest } = props;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Category filters">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close filters"
        tabIndex={-1}
      />
      {/* Panel */}
      <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background px-5 pb-10 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Categories
          </p>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <SidebarContent {...rest} />
      </div>
    </div>
  );
}

// Mobile trigger button
export function MobileFilterButton({
  activeCategory,
  onClick,
}: {
  activeCategory: string | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors lg:hidden",
        activeCategory
          ? "border-terracotta-400 bg-terracotta-50 text-terracotta-700"
          : "border-border bg-card text-foreground hover:border-terracotta-300",
      ].join(" ")}
    >
      <SlidersHorizontal className="size-4" />
      {activeCategory ? "Filter active" : "Filter"}
    </button>
  );
}
