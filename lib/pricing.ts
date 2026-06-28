// Single source of truth for subscription plan definitions.
// All prices are integer kobo (₦1 = 100 kobo). Never compute prices at runtime.
// `months` drives the subscription period_end calculation in the webhook handler.

export const PLANS = {
  monthly:   { id: "monthly",   kobo: 1000000,  label: "Monthly",   description: "Unlimited downloads for 1 month",   duration: "1 month",  months: 1,  seats: 1 },
  quarterly: { id: "quarterly", kobo: 2700000,  label: "3 Months",  description: "Unlimited downloads for 3 months",  duration: "3 months", months: 3,  seats: 1, savings: "Save ₦3,000"  },
  biannual:  { id: "biannual",  kobo: 5000000,  label: "6 Months",  description: "Unlimited downloads for 6 months",  duration: "6 months", months: 6,  seats: 1, savings: "Save ₦10,000" },
  annual:    { id: "annual",    kobo: 10000000, label: "Annual",     description: "Unlimited downloads for 1 year",    duration: "1 year",   months: 12, seats: 1, savings: "Save ₦20,000", featured: true },
} as const;

// Team plans — 5-seat bundles at a per-seat discount vs individual pricing.
// Individual monthly = ₦10k/seat. Team monthly = ₦7k/seat (30% off).
export const TEAM_PLANS = {
  team_monthly:   { id: "team_monthly",   kobo: 3500000,  label: "Team Monthly",  description: "Up to 5 seats, 1 month",   duration: "1 month",  months: 1,  seats: 5, per_seat_kobo: 700000 },
  team_quarterly: { id: "team_quarterly", kobo: 9000000,  label: "Team 3 Months", description: "Up to 5 seats, 3 months",  duration: "3 months", months: 3,  seats: 5, per_seat_kobo: 600000, savings: "Save ₦1,500/seat" },
  team_annual:    { id: "team_annual",    kobo: 30000000, label: "Team Annual",    description: "Up to 5 seats, 1 year",    duration: "1 year",   months: 12, seats: 5, per_seat_kobo: 500000, savings: "Save ₦2,400/seat", featured: true },
} as const;

// Combined lookup used by the webhook handler to resolve any plan_id.
export const ALL_PLANS = { ...PLANS, ...TEAM_PLANS } as const;

export type PlanId     = keyof typeof PLANS;
export type TeamPlanId = keyof typeof TEAM_PLANS;
export type AllPlanId  = keyof typeof ALL_PLANS;
export type Plan       = (typeof PLANS)[PlanId];
export type TeamPlan   = (typeof TEAM_PLANS)[TeamPlanId];

export const PLAN_IDS      = Object.keys(PLANS)      as PlanId[];
export const TEAM_PLAN_IDS = Object.keys(TEAM_PLANS) as TeamPlanId[];
