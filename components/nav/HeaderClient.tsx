"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Menu, ChevronDown } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/nav/UserDropdown";
import { MobileOverlay } from "@/components/nav/MobileOverlay";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useReducedMotion } from "framer-motion";
import { CONTACT_EMAIL } from "@/lib/config";
import { UpgradeNudge } from "@/components/shared/UpgradeNudge";
import type { AuthenticatedUser } from "@/lib/auth";
import type { Category } from "@/types/database";

interface HeaderClientProps {
  auth: AuthenticatedUser | null;
  categories: Pick<Category, "id" | "name" | "slug">[];
}

// Needs Suspense because useSearchParams() suspends during SSR streaming.
function CategoryLinks({
  categories,
}: {
  categories: Pick<Category, "id" | "name" | "slug">[];
}) {
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("category");

  return (
    <div className="flex flex-1 items-center gap-6 overflow-x-auto">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/browse?category=${cat.slug}`}
          className={[
            "shrink-0 whitespace-nowrap text-xs font-medium transition-colors duration-150",
            activeSlug === cat.slug
              ? "text-terracotta-400"
              : "text-white/80 hover:text-white",
          ].join(" ")}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}

// Needs Suspense because useSearchParams() suspends during SSR streaming.
function SearchForm({
  categories,
}: {
  categories: Pick<Category, "id" | "name" | "slug">[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(
    searchParams.get("category") ?? ""
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    router.push(qs ? `/browse?${qs}` : "/browse");
  }

  return (
    <form
      onSubmit={handleSearch}
      role="search"
      aria-label="Search resources"
      className="mx-auto hidden w-full max-w-lg lg:flex"
    >
      <div className="flex w-full items-center rounded-full border border-stone-200 bg-white shadow-sm transition-shadow focus-within:border-stone-300 focus-within:shadow-md">
        {/* Category select */}
        <div className="relative flex shrink-0 items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="h-10 appearance-none rounded-l-full bg-transparent py-0 pl-4 pr-6 text-sm font-medium text-stone-700 outline-none"
          >
            <option value="">All items</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-1 h-3.5 w-3.5 text-stone-400"
            aria-hidden
          />
        </div>

        {/* Divider */}
        <div className="h-5 w-px shrink-0 bg-stone-200" aria-hidden />

        {/* Text input */}
        <input
          type="search"
          placeholder="Search templates, fonts, mockups…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 min-w-0 flex-1 bg-transparent px-4 text-sm text-stone-800 placeholder:text-stone-400 outline-none"
        />

        {/* Submit */}
        <button
          type="submit"
          aria-label="Search"
          className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#14342B] text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#14342B]"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );
}

export function HeaderClient({ auth, categories }: HeaderClientProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const pastHero = useScrollPosition(isHomePage ? "landing-hero" : undefined);
  const prefersReduced = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide only on the home page for guests until past the hero; always visible for logged-in users.
  const hidden = isHomePage && !pastHero && !auth;

  return (
    <>
      {/* Skip-to-content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to content
      </a>

      <header
        className="fixed inset-x-0 top-0 z-50"
        style={{
          transform: hidden ? "translateY(-100%)" : "translateY(0)",
          transition: prefersReduced ? "none" : "transform 300ms ease",
        }}
      >
        {/* ── TOP BAR — cream ── */}
        <div className="border-b border-stone-200 bg-[#FAF4E9]">
          <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
            {/* Left: Logo */}
            <Link href="/" aria-label="Home" className="shrink-0">
              <Logo variant="full" tone="ink" size={30} />
            </Link>

            {/* Center: category + search */}
            <Suspense fallback={null}>
              <SearchForm categories={categories} />
            </Suspense>

            {/* Right: nav links + auth */}
            <div className="flex items-center gap-1">
              {/* Desktop text links */}
              <nav
                aria-label="Site links"
                className="hidden items-center gap-1 lg:flex"
              >
                <Link
                  href="/pricing"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  Pricing
                </Link>
                <Link
                  href="/license"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  License
                </Link>
              </nav>

              {/* Desktop auth */}
              <div className="hidden items-center gap-2 lg:flex">
                {auth ? (
                  <>
                    <UpgradeNudge userId={auth.user.id} />
                    <UserDropdown auth={auth} />
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                      asChild
                    >
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button
                      variant="terracotta"
                      size="sm"
                      className="rounded-full"
                      asChild
                    >
                      <Link href="/signup/start">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile: search icon */}
              <Link
                href="/browse"
                aria-label="Search resources"
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 lg:hidden"
              >
                <Search className="h-4 w-4" />
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-stone-700 transition-colors hover:bg-stone-100 lg:hidden"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR — category strip, desktop only ── */}
        <nav
          aria-label="Category navigation"
          className="hidden bg-[#14342B] lg:block"
        >
          <div className="mx-auto flex h-10 max-w-7xl items-center gap-6 px-4 sm:px-6">
            {categories.length > 0 && (
              <Suspense
                fallback={
                  <div className="flex flex-1 items-center gap-6">
                    {categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="shrink-0 whitespace-nowrap text-xs font-medium text-white/50"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                }
              >
                <CategoryLinks categories={categories} />
              </Suspense>
            )}

            {/* Contact Us — far right */}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="ml-auto shrink-0 whitespace-nowrap text-xs font-medium text-white/70 transition-colors hover:text-terracotta-400"
            >
              Contact Us
            </a>
          </div>
        </nav>
      </header>

      <MobileOverlay
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        auth={auth}
        categories={categories}
      />
    </>
  );
}
