"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlanCard } from "./PlanCard";
import { TeamPlanCard } from "./TeamPlanCard";
import { PLANS, TEAM_PLANS } from "@/lib/pricing";

type PricingMode = "individual" | "team";

interface PricingGridProps {
  currentPlanId: string | null;
  authenticated: boolean;
}

export function PricingGrid({ currentPlanId, authenticated }: PricingGridProps) {
  const [mode, setMode]             = useState<PricingMode>("individual");
  const [pending, startTransition]  = useTransition();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const router = useRouter();

  const individualPlans = Object.values(PLANS);
  const teamPlans       = Object.values(TEAM_PLANS);

  async function handleSelect(planId: string) {
    if (!authenticated) {
      router.push(`/login?next=/pricing`);
      return;
    }
    setLoadingPlanId(planId);
    startTransition(async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; data?: { authorization_url?: string } };
        if (data.ok && data.data?.authorization_url) {
          window.location.href = data.data.authorization_url;
          return;
        }
      }

      setLoadingPlanId(null);
    });
  }

  return (
    <div>
      {/* Individual / Team pill toggle */}
      <div className="mb-8 flex justify-center">
        <div className="flex rounded-full border border-border bg-muted p-1 gap-1">
          <button
            onClick={() => setMode("individual")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              mode === "individual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setMode("team")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              mode === "team"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Team
          </button>
        </div>
      </div>

      {/* Individual plans */}
      {mode === "individual" && (
        <div className="grid gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-4">
          {individualPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentPlanId === plan.id}
              onSelect={handleSelect}
              loading={pending && loadingPlanId === plan.id}
            />
          ))}
        </div>
      )}

      {/* Team plans */}
      {mode === "team" && (
        <div>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            One subscription for your whole team. Up to 5 members, unlimited downloads each.
          </p>
          <div className="mx-auto grid max-w-4xl gap-6 pt-2 sm:grid-cols-3">
            {teamPlans.map((plan) => (
              <TeamPlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={currentPlanId === plan.id}
                onSelect={handleSelect}
                loading={pending && loadingPlanId === plan.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
