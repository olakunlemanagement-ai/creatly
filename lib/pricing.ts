// Single source of truth for subscription plan definitions.
// All prices are integer kobo (₦1 = 100 kobo). Never compute prices at runtime.
// `months` drives the subscription period_end calculation in the webhook handler.

export const PLANS = {
  monthly:   { id: "monthly",   kobo: 1000000,  label: "Monthly",   description: "Unlimited downloads for 1 month",   duration: "1 month",  months: 1  },
  quarterly: { id: "quarterly", kobo: 2700000,  label: "3 Months",  description: "Unlimited downloads for 3 months",  duration: "3 months", months: 3,  savings: "Save ₦3,000"  },
  biannual:  { id: "biannual",  kobo: 5000000,  label: "6 Months",  description: "Unlimited downloads for 6 months",  duration: "6 months", months: 6,  savings: "Save ₦10,000" },
  annual:    { id: "annual",    kobo: 10000000, label: "Annual",     description: "Unlimited downloads for 1 year",    duration: "1 year",   months: 12, savings: "Save ₦20,000", featured: true },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan   = (typeof PLANS)[PlanId];

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];
