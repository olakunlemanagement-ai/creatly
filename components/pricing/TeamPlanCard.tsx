"use client";

import { Check, Users } from "lucide-react";
import { formatNaira } from "@/lib/format";
import type { TeamPlan } from "@/lib/pricing";

interface TeamPlanCardProps {
  plan: TeamPlan;
  isCurrentPlan?: boolean;
  onSelect: (planId: string) => void;
  loading?: boolean;
}

const TEAM_FEATURES = [
  "Unlimited downloads for all seats",
  "All asset types",
  "Commercial license",
  "Cancel anytime",
  "Team workspace",
  "Invite link for teammates",
];

export function TeamPlanCard({ plan, isCurrentPlan, onSelect, loading }: TeamPlanCardProps) {
  const featured = "featured" in plan && plan.featured === true;
  const savings = "savings" in plan ? (plan as { savings?: string }).savings : undefined;

  return (
    <div className="relative flex flex-col pt-5">
      {featured && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <span className="whitespace-nowrap rounded-full bg-terracotta-600 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm">
            Best for teams
          </span>
        </div>
      )}

      <div
        className={`flex flex-1 flex-col overflow-hidden rounded-2xl border transition-shadow hover:shadow-lg ${
          featured
            ? "border-2 border-terracotta-600"
            : "border-border bg-card"
        }`}
        style={featured ? { backgroundColor: "#14342B" } : undefined}
      >
        {/* Top accent bar */}
        <div
          className={`h-1 w-full shrink-0 ${
            featured ? "bg-terracotta-600" : "bg-brand-green-600/30"
          }`}
        />

        <div className="flex flex-1 flex-col p-6">
          {/* Plan name + description */}
          <div className="mb-5">
            <h3
              className={`font-display text-xl font-bold ${
                featured ? "text-cream-100" : "text-foreground"
              }`}
            >
              {plan.label}
            </h3>
            <p
              className={`mt-1 text-sm ${
                featured ? "text-cream-200/60" : "text-muted-foreground"
              }`}
            >
              {plan.description}
            </p>
          </div>

          {/* Price */}
          <div className="mb-3">
            <div className="flex items-baseline gap-1">
              <span
                className={`font-display text-4xl font-bold ${
                  featured ? "text-cream-100" : "text-foreground"
                }`}
              >
                {formatNaira(plan.kobo)}
              </span>
              <span
                className={`text-sm ${
                  featured ? "text-cream-200/50" : "text-muted-foreground"
                }`}
              >
                / {plan.duration}
              </span>
            </div>

            {/* Per-seat price */}
            <p
              className={`mt-1 text-xs font-semibold ${
                featured ? "text-terracotta-300" : "text-brand-green-700"
              }`}
            >
              {formatNaira(plan.per_seat_kobo)} per seat
            </p>

            {savings && (
              <p
                className={`mt-0.5 text-xs font-semibold ${
                  featured ? "text-terracotta-300" : "text-terracotta-600"
                }`}
              >
                {savings}
              </p>
            )}
          </div>

          {/* Seat badge */}
          <div className="mb-5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                featured
                  ? "border-white/20 bg-white/10 text-cream-200"
                  : "border-brand-green-200 bg-brand-green-50 text-brand-green-700"
              }`}
            >
              <Users className="h-3 w-3" />
              Up to {plan.seats} members
            </span>
          </div>

          {/* Feature list */}
          <ul className="mb-8 flex-1 space-y-2.5">
            {TEAM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <Check
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    featured ? "text-terracotta-400" : "text-brand-green-600"
                  }`}
                />
                <span className={featured ? "text-cream-100/85" : "text-foreground"}>
                  {f}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA */}
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
      </div>
    </div>
  );
}
