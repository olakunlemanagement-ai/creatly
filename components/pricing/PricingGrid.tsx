"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PricingToggle } from "./PricingToggle";
import { PlanCard } from "./PlanCard";
import { PLANS } from "@/lib/pricing";
import type { Plan } from "@/types/database";

interface PricingGridProps {
  /** User's current plan_id if they have an active subscription, else null. */
  currentPlanId: string | null;
  /** True when user is authenticated. */
  authenticated: boolean;
}

export function PricingGrid({ currentPlanId, authenticated }: PricingGridProps) {
  const [annual, setAnnual] = useState(false);
  const [pending, startTransition] = useTransition();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const router = useRouter();

  const soloPlans: [Plan, Plan] = [
    PLANS.solo_monthly as unknown as Plan,
    PLANS.solo_annual   as unknown as Plan,
  ];
  const teamPlans: [Plan, Plan] = [
    PLANS.team_monthly  as unknown as Plan,
    PLANS.team_annual   as unknown as Plan,
  ];

  const displayedSolo = annual ? soloPlans[1] : soloPlans[0];
  const displayedTeam = annual ? teamPlans[1] : teamPlans[0];

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

      // Non-redirect response — let the page handle error
      setLoadingPlanId(null);
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <PricingToggle annual={annual} onChange={setAnnual} />

      <div className="grid gap-6 sm:grid-cols-2">
        <PlanCard
          plan={displayedSolo}
          isCurrentPlan={currentPlanId === displayedSolo.id}
          onSelect={handleSelect}
          loading={pending && loadingPlanId === displayedSolo.id}
        />
        <PlanCard
          plan={displayedTeam}
          featured
          isCurrentPlan={currentPlanId === displayedTeam.id}
          onSelect={handleSelect}
          loading={pending && loadingPlanId === displayedTeam.id}
        />
      </div>
    </div>
  );
}
