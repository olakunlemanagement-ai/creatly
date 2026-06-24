// Single source of truth for subscription plan definitions.
// All prices are integer kobo (₦1 = 100 kobo). Annual = 10× monthly (2 months free).
// Never compute prices at runtime — read from this constant.

export const PLANS = {
  solo_monthly: { id: "solo_monthly", kobo: 150000, interval: "monthly" as const, seats: 1, label: "Solo Monthly" },
  solo_annual:  { id: "solo_annual",  kobo: 1500000, interval: "annual"  as const, seats: 1, label: "Solo Annual"  },
  team_monthly: { id: "team_monthly", kobo: 400000, interval: "monthly" as const, seats: 5, label: "Team Monthly" },
  team_annual:  { id: "team_annual",  kobo: 4000000, interval: "annual"  as const, seats: 5, label: "Team Annual"  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan   = (typeof PLANS)[PlanId];

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

/** True when the interval is annual (used for the "2 months free" badge). */
export function isAnnual(planId: PlanId): boolean {
  return PLANS[planId].interval === "annual";
}

/** Return both interval variants for a given base (solo/team). */
export function planPair(base: "solo" | "team"): { monthly: Plan; annual: Plan } {
  return {
    monthly: PLANS[`${base}_monthly`],
    annual:  PLANS[`${base}_annual`],
  };
}
