// Single source of truth for subscription plan definitions.
// All prices are integer kobo (₦1 = 100 kobo). Never compute prices at runtime.
// `months` drives the subscription period_end calculation in the webhook handler.

export const PLANS = {
  cruise:         { id: "cruise",         kobo: 500000,  label: "Cruise",         description: "Get unlimited assets for 1 month",  duration: "1 month",  months: 1  },
  cruise_plus:    { id: "cruise_plus",    kobo: 1000000, label: "Cruise Plus",    description: "Get unlimited assets for 3 months", duration: "3 months", months: 3  },
  cruise_pro:     { id: "cruise_pro",     kobo: 2000000, label: "Cruise Pro",     description: "Get unlimited assets for 6 months", duration: "6 months", months: 6  },
  cruise_pro_max: { id: "cruise_pro_max", kobo: 4000000, label: "Cruise Pro Max", description: "Get unlimited assets for 1 year",   duration: "1 year",   months: 12, featured: true },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan   = (typeof PLANS)[PlanId];

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];
