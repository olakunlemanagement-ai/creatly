"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { APP_NAME } from "@/lib/config";

interface BrowseHeroProps {
  initialQuery: string;
}

export function BrowseHero({ initialQuery }: BrowseHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function buildSearchUrl(value: string): string {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    return `/browse?${params.toString()}`;
  }

  function handleChange(value: string) {
    setInputValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      startTransition(() => {
        router.replace(buildSearchUrl(value));
      });
    }, 300);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    startTransition(() => {
      router.replace(buildSearchUrl(inputValue));
    });
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

        <form
          role="search"
          onSubmit={handleSubmit}
          className="mt-8 flex w-full items-center gap-0 overflow-hidden rounded-xl bg-cream-50 shadow-lg ring-1 ring-white/10"
          aria-label={`Search ${APP_NAME}`}
        >
          <label htmlFor="hero-search" className="sr-only">
            Search resources
          </label>
          <input
            id="hero-search"
            type="search"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search templates, fonts, mockups…"
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-busy={isPending}
          />
          <button
            type="submit"
            aria-label="Search"
            className={`flex items-center gap-2 bg-terracotta-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${isPending ? "opacity-70" : ""}`}
          >
            <Search className="size-4" aria-hidden="true" />
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
