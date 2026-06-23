"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { UserDropdown } from "@/components/nav/UserDropdown";
import { MobileOverlay } from "@/components/nav/MobileOverlay";
import { useScrolled } from "@/hooks/useScrolled";
import type { AuthenticatedUser } from "@/lib/auth";
import type { Category } from "@/types/database";

interface HeaderClientProps {
  auth: AuthenticatedUser | null;
  categories: Pick<Category, "id" | "name" | "slug">[];
  /** When true the header starts transparent (over a hero). When false always solid. */
  transparent?: boolean;
}

// Isolated into its own component so the parent doesn't need a Suspense boundary.
// useSearchParams() requires Suspense when used in a component that renders
// during SSR — wrapping here keeps the boundary tight.
function CategoryLinks({
  categories,
}: {
  categories: Pick<Category, "id" | "name" | "slug">[];
}) {
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("category");

  return (
    <>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/browse?category=${cat.slug}`}
          className={[
            "flex-1 text-center text-xs font-medium transition-colors duration-150 hover:text-white",
            activeSlug === cat.slug ? "text-terracotta-400" : "text-white/75",
          ].join(" ")}
        >
          {cat.name}
        </Link>
      ))}
    </>
  );
}

export function HeaderClient({
  auth,
  categories,
  transparent = true,
}: HeaderClientProps) {
  const scrolled = useScrolled(16);
  const solid = !transparent || scrolled;
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
  }

  return (
    <>
      {/* Skip-to-content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Slide-down entrance on first load */}
      <motion.header
        initial={prefersReduced ? false : { y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50"
      >
        {/* ── TOP BAR ── */}
        <div
          className={[
            "transition-all duration-300 motion-reduce:transition-none",
            solid
              ? "border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-md"
              : "bg-transparent",
          ].join(" ")}
        >
          <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">

            {/* Left: Logo */}
            <motion.div
              whileHover={prefersReduced ? {} : { scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="shrink-0"
            >
              <Link href="/" aria-label="Home">
                <Logo variant="full" tone={solid ? "ink" : "cream"} size={30} />
              </Link>
            </motion.div>

            {/* Center: Search bar — desktop only */}
            <form
              onSubmit={handleSearch}
              role="search"
              aria-label="Search resources"
              className="mx-auto hidden w-full max-w-sm lg:flex"
            >
              <div className="relative w-full">
                <Search
                  className={[
                    "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
                    solid ? "text-muted-foreground" : "text-cream-200",
                  ].join(" ")}
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Search templates, fonts, mockups…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={[
                    "w-full rounded-full py-2 pl-9 pr-4 text-sm outline-none ring-1 transition-all duration-200",
                    solid
                      ? "bg-muted/70 text-foreground placeholder:text-muted-foreground ring-border/40 focus:ring-brand-green-400"
                      : "bg-white/15 text-cream-100 placeholder:text-cream-300/70 ring-white/20 backdrop-blur-sm focus:bg-white/20 focus:ring-white/40",
                  ].join(" ")}
                />
              </div>
            </form>

            {/* Right: Auth actions */}
            <div className="flex items-center gap-2">
              {/* Mobile: search icon navigates to /browse */}
              <Link
                href="/browse"
                aria-label="Search resources"
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/10 lg:hidden",
                  solid ? "text-foreground/70" : "text-cream-100/70 hover:bg-white/10",
                ].join(" ")}
              >
                <Search className="h-4 w-4" />
              </Link>

              {/* Desktop auth */}
              <div className="hidden lg:flex lg:items-center lg:gap-2">
                {auth ? (
                  <UserDropdown auth={auth} />
                ) : (
                  <>
                    <Link
                      href="/login"
                      className={[
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        solid
                          ? "text-foreground/80 hover:bg-muted hover:text-foreground"
                          : "text-cream-100/80 hover:bg-white/10 hover:text-cream-100",
                      ].join(" ")}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-full bg-terracotta-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-md transition-colors lg:hidden",
                  solid ? "text-foreground hover:bg-muted" : "text-cream-100 hover:bg-white/10",
                ].join(" ")}
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
          <div className="mx-auto flex h-10 max-w-7xl items-center px-4 sm:px-6">
            {categories.length > 0 && (
              <Suspense
                fallback={categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="flex-1 text-center text-xs font-medium text-white/75"
                  >
                    {cat.name}
                  </span>
                ))}
              >
                <CategoryLinks categories={categories} />
              </Suspense>
            )}
          </div>
        </nav>
      </motion.header>

      <MobileOverlay
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        auth={auth}
        categories={categories}
      />
    </>
  );
}
