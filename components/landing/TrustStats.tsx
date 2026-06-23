"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";

const STATS = [
  { value: 2400, suffix: "+", label: "Creative assets" },
  { value: 50,   suffix: "+", label: "Creators" },
  { value: 12,   suffix: "",  label: "Categories" },
  { value: 100,  suffix: "%", label: "Commercial licence" },
] as const;

function StatItem({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const count = useCountUp(value, 1400, isInView);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1 px-6 py-4">
      <span className="font-heading text-3xl font-semibold text-foreground sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
        {count.toLocaleString()}{suffix}
      </span>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export function TrustStats() {
  return (
    <section className="border-y border-border bg-cream-50" aria-label="Platform statistics">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
          {STATS.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
