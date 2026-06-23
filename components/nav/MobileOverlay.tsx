"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { signOut } from "@/lib/actions/auth";
import type { AuthenticatedUser } from "@/lib/auth";
import type { Category } from "@/types/database";

interface MobileOverlayProps {
  open: boolean;
  onClose: () => void;
  auth: AuthenticatedUser | null;
  categories: Pick<Category, "id" | "name" | "slug">[];
}

const NAV_LINKS = [
  { label: "Browse",       href: "/browse" },
  { label: "For Creators", href: "/creators" },
  { label: "Pricing",      href: "/pricing" },
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

export function MobileOverlay({ open, onClose, auth, categories }: MobileOverlayProps) {
  const prefersReduced = useReducedMotion();

  // Lock body scroll while menu is open; close on Escape
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
              className="flex h-10 w-10 items-center justify-center rounded-full text-cream-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-200"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Mobile navigation">
            {/* Primary links — stagger in */}
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
                    <ChevronRight className="h-5 w-5 text-cream-300" />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>

            {/* Category list */}
            {categories.length > 0 && (
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-cream-300">
                  Categories
                </p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/browse?category=${cat.slug}`}
                        onClick={onClose}
                        className="block py-1.5 text-sm text-cream-200 transition-colors hover:text-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-200"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>

          {/* Auth actions */}
          <div className="border-t border-white/10 px-5 py-6">
            {auth ? (
              <div className="space-y-3">
                <p className="text-sm text-cream-300">
                  Signed in as <span className="font-medium text-cream-100">{auth.user.email}</span>
                </p>
                <Link href="/dashboard" onClick={onClose} className="block text-sm font-medium text-cream-100 hover:text-terracotta-400">
                  Dashboard →
                </Link>
                <form action={signOut}>
                  <button type="submit" className="text-sm text-cream-300 hover:text-cream-100">
                    Log out
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-white/20 py-3 text-center text-sm font-medium text-cream-200 transition-colors hover:border-white/40 hover:text-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-200"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="flex-1 rounded-lg bg-terracotta-500 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
