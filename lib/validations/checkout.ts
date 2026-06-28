import { z } from "zod";
import { PLAN_IDS, TEAM_PLAN_IDS } from "@/lib/pricing";

const ALL_PLAN_IDS = [...PLAN_IDS, ...TEAM_PLAN_IDS] as [string, ...string[]];

export const checkoutSchema = z.object({
  planId: z.enum(ALL_PLAN_IDS),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
