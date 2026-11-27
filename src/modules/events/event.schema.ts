import { z } from "zod";

export const createEventSchema = z.object({
  name: z.string().trim().min(1),
  pricePaise: z.number().int().positive(),
});

