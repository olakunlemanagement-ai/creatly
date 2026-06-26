"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlanCard } from "./PlanCard";
import { PLANS } from "@/lib/pricing";

interface PricingGridProps {
  currentPlanId: string | null;
  authenticated: boolean;
}

export function PricingGrid({ currentPlanId, authenticated }: PricingGridProps) {
  const [pending, startTransition] = useTransition();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const router = useRouter();

  const plans = Object.values(PLANS);

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
    <div className="grid gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isCurrentPlan={currentPlanId === plan.id}
          onSelect={handleSelect}
          loading={pending && loadingPlanId === plan.id}
        />
      ))}
    </div>
  );
}
