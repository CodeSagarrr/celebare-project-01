import { z } from "zod";

export const photographerSettingsSchema = z.object({
  name: z.string().trim().min(1),
  upiId: z.string().trim().min(3),
  bankCode: z.string().trim().min(1),
  inboxAddress: z.string().trim().email(),
});
