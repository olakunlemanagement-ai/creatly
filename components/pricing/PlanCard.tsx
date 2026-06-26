"use client";

import { Check } from "lucide-react";
import { formatNaira } from "@/lib/format";
import type { Plan } from "@/lib/pricing";

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  onSelect: (planId: string) => void;
  loading?: boolean;
}

const FEATURES = [
  "Unlimited downloads",
  "All templates, fonts, mockups & motion assets",
  "New assets every week",
  "Commercial license",
];

export function PlanCard({ plan, isCurrentPlan, onSelect, loading }: PlanCardProps) {
  const featured = "featured" in plan && plan.featured === true;
  const savings = "savings" in plan ? (plan as { savings?: string }).savings : undefined;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-md ${
        featured
          ? "border-2 border-terracotta-600 bg-forest-900 text-cream-100"
          : "border-border bg-card"
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-terracotta-600 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
          Most Popular
        </span>
      )}

      {savings && (
        <span className="absolute right-4 top-4 rounded-full bg-terracotta-100 px-2.5 py-0.5 text-xs font-bold text-terracotta-700">
          {savings}
        </span>
      )}

      <div className="mb-4">
        <h3
          className={`font-display text-xl font-bold ${
            featured ? "text-cream-100" : "text-foreground"
          }`}
        >
          {plan.label}
        </h3>
        <p
          className={`mt-1 text-sm ${
            featured ? "text-cream-200/70" : "text-muted-foreground"
          }`}
        >
          {plan.description}
        </p>
      </div>

      <div className="mb-6">
        <span
          className={`font-display text-4xl font-bold ${
            featured ? "text-cream-100" : "text-foreground"
          }`}
        >
          {formatNaira(plan.kobo)}
        </span>
        <span
          className={`ml-1 text-sm ${
            featured ? "text-cream-200/70" : "text-muted-foreground"
          }`}
        >
          / {plan.duration}
        </span>
      </div>

      <ul className="mb-6 flex-1 space-y-3">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                featured ? "text-terracotta-400" : "text-brand-green-600"
              }`}
            />
            <span className={featured ? "text-cream-100/90" : "text-foreground"}>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.id)}
        disabled={isCurrentPlan || loading}
        className={`w-full rounded-xl py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          isCurrentPlan
            ? "cursor-default border border-current opacity-60"
            : featured
            ? "bg-terracotta-600 text-white hover:bg-terracotta-700 focus-visible:ring-terracotta-600"
            : "bg-brand-green-700 text-cream-100 hover:bg-brand-green-800 focus-visible:ring-brand-green-700"
        }`}
      >
        {loading ? "Processing…" : isCurrentPlan ? "Current plan" : "Get started"}
      </button>
    </div>
  );
}
