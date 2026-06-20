// ============================================================
// ENUM CONSTANTS — single source of truth for all status/type values.
// Reference these constants; never write the raw string literals inline.
// ============================================================

export const PLAN_TYPES = [
  "personal_monthly",
  "personal_annual",
  "team_monthly",
  "team_annual",
] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export const SUBSCRIPTION_STATUS = [
  "pending",
  "active",
  "past_due",
  "cancelled",
  "expired",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

export const RESOURCE_STATUS = ["draft", "published", "archived"] as const;
export type ResourceStatus = (typeof RESOURCE_STATUS)[number];

export const USER_ROLE = ["user", "admin", "creator"] as const;
export type UserRole = (typeof USER_ROLE)[number];

// ============================================================
// SUPABASE GENERATED TYPES
// Run `supabase gen types typescript --local > types/database.ts` after
// Step 1.2 (DB schema migration) and paste the output here, then
// re-export the row types you need below this comment block.
// TODO(step-1.2): replace this placeholder with generated Supabase types
// ============================================================
