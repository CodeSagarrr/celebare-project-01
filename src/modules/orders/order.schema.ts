import { z } from "zod";

export const createOrderSchema = z.object({
  eventId: z.string().min(1),
  photoIds: z.array(z.string().min(1)).min(1),
}).superRefine(({ photoIds }, context) => {
  if (new Set(photoIds).size !== photoIds.length)
    context.addIssue({ code: "custom", path: ["photoIds"], message: "Photo IDs must be unique" });
});
