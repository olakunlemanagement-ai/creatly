import { z } from "zod";
import { PLAN_IDS } from "@/lib/pricing";

export const checkoutSchema = z.object({
  planId: z.enum(PLAN_IDS as [string, ...string[]]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
