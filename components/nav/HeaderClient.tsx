"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, ChevronDown } from "lucide-react";
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

const NAV_LINKS = [
  { label: "Browse",       href: "/browse" },
  { label: "For Creators", href: "/creators" },
  { label: "Pricing",      href: "/pricing" },
] as const;

export function HeaderClient({ auth, categories, transparent = true }: HeaderClientProps) {
  const scrolled = useScrolled(16);
  const solid = !transparent || scrolled;
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);

  const closeMega = useCallback(() => setMegaOpen(false), []);

  useEffect(() => {
    if (!megaOpen) return;
    const handler = (e: MouseEvent | FocusEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) closeMega();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("focusin", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("focusin", handler);
    };
  }, [megaOpen, closeMega]);

  useEffect(() => {
    if (!megaOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeMega(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [megaOpen, closeMega]);

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
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all duration-300 motion-reduce:transition-none",
          solid
            ? "border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-md"
            : "bg-transparent",
        ].join(" ")}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* Left: Logo with hover pulse */}
          <motion.div
            whileHover={prefersReduced ? {} : { scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="shrink-0"
          >
            <Link href="/" aria-label="Home">
              <Logo variant="full" tone={solid ? "ink" : "cream"} size={30} />
            </Link>
          </motion.div>

          {/* Center: Desktop nav */}
          <nav className="hidden lg:flex lg:items-center lg:gap-6" aria-label="Primary navigation">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "relative py-1 text-sm font-medium transition-colors duration-150 hover:opacity-100",
                    solid
                      ? "text-foreground/80 hover:text-foreground"
                      : "text-cream-100/80 hover:text-cream-100",
                  ].join(" ")}
                >
                  {label}
                  {/* Animated underline — layoutId lets it slide between active links */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-terracotta-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Categories mega-menu */}
            <div ref={megaRef} className="relative">
              <button
                onClick={() => setMegaOpen((o) => !o)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setMegaOpen((o) => !o); }
                }}
                aria-haspopup="menu"
                aria-expanded={megaOpen}
                className={[
                  "flex items-center gap-1 text-sm font-medium transition-colors duration-150 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  solid ? "text-foreground/80 hover:text-foreground" : "text-cream-100/80 hover:text-cream-100",
                ].join(" ")}
              >
                Categories
                <ChevronDown className={["h-3.5 w-3.5 transition-transform duration-200", megaOpen ? "rotate-180" : ""].join(" ")} />
              </button>

              {megaOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-border bg-background p-4 shadow-xl animate-in fade-in-0 slide-in-from-top-2 duration-150"
                >
                  {categories.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No categories yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/browse?category=${cat.slug}`}
                          role="menuitem"
                          onClick={closeMega}
                          className="block rounded-md px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Right: Search + auth */}
          <div className="flex items-center gap-2">
            <Link
              href="/browse"
              aria-label="Search resources"
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/10",
                solid ? "text-foreground/70" : "text-cream-100/70 hover:bg-white/10",
              ].join(" ")}
            >
              <Search className="h-4 w-4" />
            </Link>

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
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-terracotta-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>

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
