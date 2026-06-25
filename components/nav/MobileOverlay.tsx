"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ChevronRight, ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { CONTACT_EMAIL } from "@/lib/config";
import type { AuthenticatedUser } from "@/lib/auth";
import type { NavCategory } from "@/components/nav/SiteHeader";

interface MobileOverlayProps {
  open: boolean;
  onClose: () => void;
  auth: AuthenticatedUser | null;
  navCategories: NavCategory[];
}

const NAV_LINKS = [
  { label: "Browse",           href: "/browse" },
  { label: "Become a creator", href: "/creators" },
  { label: "Pricing",          href: "/pricing" },
  { label: "License",          href: "/license" },
] as const;

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
} as const;
const itemVariants = {
  hidden: { opacity: 0, x: -24 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.35, ease: EXPO_OUT } },
} as const;

export function MobileOverlay({ open, onClose, auth, navCategories }: MobileOverlayProps) {
  const prefersReduced = useReducedMotion();
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function toggleExpand(slug: string) {
    setExpandedSlug((prev) => (prev === slug ? null : slug));
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-[100] flex flex-col bg-brand-green-900"
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReduced ? {} : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-4">
            <Link href="/" onClick={onClose} aria-label="Home">
              <Logo variant="full" tone="cream" size={28} />
            </Link>
            <button
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-full text-cream-200 transition-all duration-150 hover:scale-110 hover:bg-white/10 hover:text-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-200 active:scale-95 motion-reduce:transition-colors"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Mobile navigation">
            {/* Primary links */}
            <motion.ul
              className="space-y-1"
              variants={prefersReduced ? undefined : listVariants}
              initial={prefersReduced ? false : "hidden"}
              animate="show"
            >
              {NAV_LINKS.map(({ label, href }) => (
                <motion.li key={href} variants={prefersReduced ? undefined : itemVariants}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className="flex items-center justify-between py-4 font-heading text-3xl font-semibold text-cream-100 transition-colors hover:text-terracotta-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-200"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {label}
                    <ChevronRight className="size-5 text-cream-300" />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>

            {/* Hierarchical category list */}
            {navCategories.length > 0 && (
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-cream-300">
                  Categories
                </p>
                <ul className="space-y-1">
                  {navCategories.map((cat) => {
                    const hasChildren = cat.children.length > 0;
                    const isExpanded = expandedSlug === cat.slug;

                    return (
                      <li key={cat.id}>
                        <div className="flex items-center">
                          <Link
                            href={`/browse?category=${cat.slug}`}
                            onClick={onClose}
                            className="flex-1 py-2 text-sm font-medium text-cream-200 transition-colors hover:text-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-200"
                          >
                            {cat.name}
                          </Link>
                          {hasChildren && (
                            <button
                              onClick={() => toggleExpand(cat.slug)}
                              aria-expanded={isExpanded}
                              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${cat.name}`}
                              className="flex size-8 items-center justify-center rounded text-cream-400 transition-colors hover:bg-white/10 hover:text-cream-200"
                            >
                              <ChevronDown
                                className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </button>
                          )}
                        </div>

                        {hasChildren && isExpanded && (
                          <ul className="mb-2 ml-3 space-y-0.5 border-l border-white/10 pl-3">
                            {cat.children.map((child) => (
                              <li key={child.id}>
                                <Link
                                  href={`/browse?category=${child.slug}`}
                                  onClick={onClose}
                                  className="block py-1.5 text-xs text-cream-300 transition-colors hover:text-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-200"
                                >
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Contact */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm text-cream-300 transition-colors hover:text-cream-100"
              >
                Contact Us
              </a>
            </div>
          </nav>

          {/* Auth actions */}
          <div className="border-t border-white/10 px-5 py-6">
            {auth ? (
              <div className="space-y-3">
                <p className="text-sm text-cream-300">
                  Signed in as <span className="font-medium text-cream-100">{auth.user.email}</span>
                </p>
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-cream-100 transition-colors hover:text-terracotta-400"
                >
                  Dashboard
                  <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none" />
                </Link>
                <form action={signOut}>
                  <button type="submit" className="text-sm text-cream-300 hover:text-cream-100">
                    Log out
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="ghost-cream" size="cta" className="flex-1 justify-center" asChild>
                  <Link href="/login" onClick={onClose}>Sign In</Link>
                </Button>
                <Button variant="terracotta" size="cta" className="flex-1 justify-center" asChild>
                  <Link href="/signup/start" onClick={onClose}>Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
