"use client";

import { Check } from "lucide-react";
import { formatNaira } from "@/lib/format";
import type { Plan } from "@/types/database";

interface PlanCardProps {
  plan: Plan;
  featured?: boolean;
  isCurrentPlan?: boolean;
  onSelect: (planId: string) => void;
  loading?: boolean;
}

const FEATURES: Record<string, string[]> = {
  solo: [
    "Unlimited downloads",
    "Access to all templates, fonts & mockups",
    "New assets every week",
    "Commercial license",
    "1 seat",
  ],
  team: [
    "Everything in Solo",
    "5 team seats",
    "Shared team workspace",
    "Priority support",
    "Team billing",
  ],
};

export function PlanCard({ plan, featured, isCurrentPlan, onSelect, loading }: PlanCardProps) {
  const base = plan.id.startsWith("solo") ? "solo" : "team";
  const features = FEATURES[base];
  const intervalLabel = plan.interval === "annual" ? "/year" : "/month";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 ${
        featured
          ? "border-accent bg-brand-green-700 text-cream-100"
          : "border-border bg-card text-foreground"
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
          Most popular
        </span>
      )}

      <div className="mb-6">
        <h3 className={`font-display text-xl font-bold ${featured ? "text-cream-100" : "text-foreground"}`}>
          {base === "solo" ? "Solo" : "Team"}
        </h3>
        <p className={`mt-1 text-sm ${featured ? "text-cream-300" : "text-muted-foreground"}`}>
          {base === "solo" ? "For individual creatives" : "For creative teams up to 5"}
        </p>
      </div>

      <div className="mb-8">
        <span className={`font-display text-4xl font-bold ${featured ? "text-cream-100" : "text-foreground"}`}>
          {formatNaira(plan.kobo)}
        </span>
        <span className={`ml-1 text-sm ${featured ? "text-cream-300" : "text-muted-foreground"}`}>
          {intervalLabel}
        </span>
        {plan.interval === "annual" && (
          <p className={`mt-1 text-xs ${featured ? "text-cream-400" : "text-muted-foreground"}`}>
            Billed annually · save {formatNaira(plan.kobo / 10 * 2)}
          </p>
        )}
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-accent" : "text-brand-green-600"}`} />
            <span className={featured ? "text-cream-200" : "text-foreground"}>{f}</span>
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
            ? "bg-accent text-white hover:bg-accent/90 focus-visible:ring-accent"
            : "bg-brand-green-700 text-cream-100 hover:bg-brand-green-800 focus-visible:ring-brand-green-700"
        }`}
      >
        {loading ? "Processing…" : isCurrentPlan ? "Current plan" : "Get started"}
      </button>
    </div>
  );
}
