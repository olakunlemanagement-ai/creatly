import { z } from "zod";

export const approveResourceSchema = z.object({
  resourceId: z.string().uuid(),
});

export const rejectResourceSchema = z.object({
  resourceId: z.string().uuid(),
  reason: z.string().min(10, "Rejection reason must be at least 10 characters").max(500),
});
