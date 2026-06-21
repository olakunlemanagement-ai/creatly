"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { APP_NAME } from "@/lib/config";

export function BrowseHero() {
  const router = useRouter();
  // TODO 1.5: wire real search query logic
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/browse?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <section className="bg-brand-green-800 px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-heading text-3xl leading-tight text-cream-100 sm:text-5xl">
          Unlimited downloads for{" "}
          <span className="text-terracotta-300">African creatives</span>
        </h1>
        <p className="mt-4 text-base text-cream-200 sm:text-lg">
          One subscription. Every template, font, mockup, and motion asset you need.
        </p>

        {/* Search bar — visual/routing stub; real query wired in 1.5 */}
        <form
          role="search"
          onSubmit={handleSearch}
          className="mt-8 flex w-full items-center gap-0 overflow-hidden rounded-xl bg-cream-50 shadow-lg ring-1 ring-white/10"
          aria-label={`Search ${APP_NAME}`}
        >
          <label htmlFor="hero-search" className="sr-only">
            Search resources
          </label>
          <input
            id="hero-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates, fonts, mockups…"
            className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex items-center gap-2 bg-terracotta-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>

        <p className="mt-4 text-xs text-cream-300">
          Thousands of templates, fonts, mockups &amp; more — new assets added weekly
        </p>
      </div>
    </section>
  );
}
