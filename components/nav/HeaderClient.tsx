"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Menu, ChevronDown } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/nav/UserDropdown";
import { MobileOverlay } from "@/components/nav/MobileOverlay";
import { CONTACT_EMAIL } from "@/lib/config";
import { UpgradeNudge } from "@/components/shared/UpgradeNudge";
import type { AuthenticatedUser } from "@/lib/auth";
import type { NavCategory } from "@/components/nav/SiteHeader";

interface HeaderClientProps {
  auth: AuthenticatedUser | null;
  navCategories: NavCategory[];
}

// Number of categories shown before the "More +" overflow button
const CATEGORY_VISIBLE_COUNT = 8;

// ── Search form (needs Suspense for useSearchParams) ──────────────────────────
function SearchForm({ navCategories }: { navCategories: NavCategory[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");

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
        {/* Category select — shows main categories only */}
        <div className="relative flex shrink-0 items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="h-10 appearance-none rounded-l-full bg-transparent py-0 pl-4 pr-6 text-sm font-medium text-stone-700 outline-none"
          >
            <option value="">All items</option>
            {navCategories.map((cat) => (
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

        <div className="h-5 w-px shrink-0 bg-stone-200" aria-hidden />

        <input
          type="search"
          placeholder="Search templates, fonts, mockups…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 min-w-0 flex-1 bg-transparent px-4 text-sm text-stone-800 placeholder:text-stone-400 outline-none"
        />

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

// ── Mega-menu category strip (needs Suspense for useSearchParams) ─────────────
function CategoryStrip({ navCategories }: { navCategories: NavCategory[] }) {
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("category");

  // Mega-menu open/close for individual categories (hover)
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "More +" overflow dropdown
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const visibleCats = navCategories.slice(0, CATEGORY_VISIBLE_COUNT);
  const hiddenCats = navCategories.slice(CATEGORY_VISIBLE_COUNT);

  useEffect(() => {
    if (!moreOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  function open(slug: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMoreOpen(false);
    setOpenSlug(slug);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpenSlug(null), 120);
  }

  return (
    <div className="flex flex-1 items-center gap-1 overflow-hidden">
      {visibleCats.map((cat) => {
        const hasChildren = cat.children.length > 0;
        const isActive = activeSlug === cat.slug || cat.children.some((c) => c.slug === activeSlug);
        const isOpen = openSlug === cat.slug;

        return (
          <div
            key={cat.id}
            className="relative shrink-0"
            onMouseEnter={() => hasChildren && open(cat.slug)}
            onMouseLeave={scheduleClose}
          >
            <Link
              href={`/browse?category=${cat.slug}`}
              className={[
                "inline-flex items-center gap-0.5 whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium transition-colors duration-150",
                isActive
                  ? "text-terracotta-300"
                  : "text-white/80 hover:text-white",
              ].join(" ")}
            >
              {cat.name}
              {hasChildren && (
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              )}
            </Link>

            {/* Sub-category dropdown panel */}
            {hasChildren && isOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-white/10 bg-brand-green-900 p-3 shadow-xl"
                onMouseEnter={() => open(cat.slug)}
                onMouseLeave={scheduleClose}
              >
                <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
                  {cat.name}
                </p>
                <ul className="space-y-0.5">
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/browse?category=${child.slug}`}
                        onClick={() => setOpenSlug(null)}
                        className={[
                          "block rounded px-2 py-1.5 text-xs transition-colors",
                          activeSlug === child.slug
                            ? "bg-white/10 text-terracotta-300"
                            : "text-white/75 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      {/* More + overflow button */}
      {hiddenCats.length > 0 && (
        <div ref={moreRef} className="relative ml-1 shrink-0">
          <button
            onClick={() => {
              setOpenSlug(null);
              setMoreOpen((o) => !o);
            }}
            aria-expanded={moreOpen}
            aria-haspopup="true"
            className="inline-flex items-center whitespace-nowrap rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/25"
          >
            More +
          </button>

          {moreOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-lg border border-white/10 bg-brand-green-900 p-4 shadow-xl">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/40">
                More categories
              </p>
              <div className="grid grid-cols-2 gap-0.5">
                {hiddenCats.map((cat) => {
                  const isActive =
                    activeSlug === cat.slug ||
                    cat.children.some((c) => c.slug === activeSlug);
                  return (
                    <Link
                      key={cat.id}
                      href={`/browse?category=${cat.slug}`}
                      onClick={() => setMoreOpen(false)}
                      className={[
                        "rounded px-2 py-1.5 text-xs transition-colors",
                        isActive
                          ? "text-terracotta-300"
                          : "text-white/75 hover:bg-white/10 hover:text-white",
                      ].join(" ")}
                    >
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HeaderClient({ auth, navCategories }: HeaderClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const [visible, setVisible] = useState(pathname !== '/');

  useEffect(() => {
    if (pathname !== '/') {
      setVisible(true);
      return;
    }

    const hero = document.getElementById('hero-section');
    if (!hero) return;

    const handleScroll = () => {
      const heroBottom = hero.getBoundingClientRect().bottom;
      setVisible(heroBottom <= 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to content
      </a>

      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-transform duration-300",
          visible ? "translate-y-0" : "-translate-y-full",
        ].join(" ")}
      >
        {/* ── TOP BAR ── */}
        <div className="border-b border-stone-200 bg-[#FAF4E9]">
          <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
            <Link href="/" aria-label="Home" className="shrink-0">
              <Logo variant="full" tone="ink" size={30} />
            </Link>

            <Suspense fallback={null}>
              <SearchForm navCategories={navCategories} />
            </Suspense>

            <div className="flex items-center gap-1">
              <nav aria-label="Site links" className="hidden items-center gap-1 lg:flex">
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
                {(!auth || auth.profile.role !== "creator") && (
                  <Link
                    href="/creators"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
                  >
                    Become a creator
                  </Link>
                )}
              </nav>

              <div className="hidden items-center gap-2 lg:flex">
                {auth ? (
                  <>
                    {auth.profile.role !== "creator" && <UpgradeNudge userId={auth.user.id} />}
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

              <Link
                href="/browse"
                aria-label="Search resources"
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 lg:hidden"
              >
                <Search className="h-4 w-4" />
              </Link>

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

        {/* ── CATEGORY BAR — desktop mega-menu strip ── */}
        <nav aria-label="Category navigation" className="hidden bg-[#14342B] lg:block">
          <div className="mx-auto flex h-10 max-w-7xl items-center gap-1 px-4 sm:px-6">
            {navCategories.length > 0 && (
              <Suspense
                fallback={
                  <div className="flex flex-1 items-center gap-4 overflow-hidden">
                    {navCategories.slice(0, CATEGORY_VISIBLE_COUNT).map((cat) => (
                      <span key={cat.id} className="shrink-0 whitespace-nowrap text-xs font-medium text-white/50">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                }
              >
                <CategoryStrip navCategories={navCategories} />
              </Suspense>
            )}

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
        navCategories={navCategories}
      />
    </>
  );
}
