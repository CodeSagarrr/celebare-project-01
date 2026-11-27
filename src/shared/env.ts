import { z } from "zod";

const cloudinarySchema = z.object({
  cloudName: z.string().min(1),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
});

export function getCloudinaryEnv() {
  const result = cloudinarySchema.safeParse({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  });
  if (!result.success) throw new Error("Cloudinary environment is not configured");
  return result.data;
}
