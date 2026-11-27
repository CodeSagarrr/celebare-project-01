import { z } from "zod";

export const photoUploadSchema = z.object({
  files: z.array(z.instanceof(File)).min(1).max(20),
});
