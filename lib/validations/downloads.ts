import { z } from "zod";

export const downloadResourceParamsSchema = z.object({
  resourceId: z.string().uuid(),
});

export const downloadHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
});
