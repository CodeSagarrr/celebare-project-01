import { z } from "zod";

export const ingestInputSchema = z.object({
  rawEmail: z.string().min(1).max(1_000_000),
  to: z.string().email(),
});
