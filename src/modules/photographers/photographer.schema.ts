import { z } from "zod";

export const createPhotographerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  upiId: z.string().trim().min(3),
  bankCode: z.string().trim().min(1),
  inboxAddress: z.string().trim().email(),
});
