import { z } from "zod";

export const demoCaseSchema = z.enum([
  "success",
  "fake-sender",
  "duplicate",
  "late",
  "wrong-amount",
  "wrong-receiver",
]);

export const simulatePaymentSchema = z.object({
  photographerId: z.enum(["photo-asha", "photo-rohan"]),
  case: demoCaseSchema,
});

export type DemoCase = z.infer<typeof demoCaseSchema>;
