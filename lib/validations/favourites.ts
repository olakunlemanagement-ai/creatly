import { z } from "zod";

export const toggleFavouriteParamsSchema = z.object({
  resourceId: z.string().uuid("resourceId must be a valid UUID"),
});
