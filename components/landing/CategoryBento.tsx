"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/shared/Reveal";
import type { Category } from "@/types/database";

interface CategoryBentoProps {
  categories: Pick<Category, "id" | "name" | "slug">[];
}

export function CategoryBento({ categories }: CategoryBentoProps) {
  const prefersReduced = useReducedMotion();

  if (categories.length === 0) return null;

  const [first, ...rest] = categories;

  return (
    <section className="bg-cream-50 px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {"// Explore by type"}
            </p>
            <h2
              className="mt-3 font-heading text-4xl text-foreground sm:text-5xl"
              style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
            >
              Every resource type,
              <br />
              <span className="text-terracotta-600">in one place.</span>
            </h2>
          </div>
        </Reveal>

        {/* Bento grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {/* Hero tile — spans 2 cols; dark, no flood effect */}
          {first && (
            <motion.div
              className="col-span-2"
              initial={prefersReduced ? false : { opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Link
                href={`/browse?category=${first.slug}`}
                className="flex items-end rounded-2xl border border-border bg-brand-green-900 px-6 py-8 text-cream-100 transition-shadow duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ minHeight: 140 }}
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-cream-300 opacity-70">
                    Popular
                  </p>
                  <p className="mt-1 font-heading text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
                    {first.name}
                  </p>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Remaining tiles — spring bounce-in + color flood on hover */}
          {rest.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={prefersReduced ? false : { opacity: 0, scale: 0.85, y: 24 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: (i + 1) * 0.05 }}
            >
              <Link
                href={`/browse?category=${cat.slug}`}
                className="group relative flex items-end overflow-hidden rounded-2xl border border-border bg-card px-5 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ minHeight: 100 }}
              >
                {/* Color flood layer — scales from center on hover */}
                <span
                  className="pointer-events-none absolute inset-0 scale-0 rounded-full bg-terracotta-500 transition-transform duration-300 ease-out group-hover:scale-[2.5]"
                  aria-hidden="true"
                />
                <p
                  className="relative z-10 font-heading text-lg leading-snug text-foreground transition-colors duration-200 group-hover:text-white"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {cat.name}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-8">
            <Link
              href="/browse"
              className="group inline-flex items-center gap-1 text-sm font-medium text-terracotta-600 underline-offset-4 hover:underline"
            >
              Browse all resources
              <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
