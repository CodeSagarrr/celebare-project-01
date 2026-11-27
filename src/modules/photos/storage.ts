import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnv } from "@/src/shared/env";

export class StorageError extends Error {
  readonly status = 502;
  constructor(message = "Photo storage request failed") { super(message); this.name = "StorageError"; }
}

function client() {
  const config = getCloudinaryEnv();
  cloudinary.config({ cloud_name: config.cloudName, api_key: config.apiKey, api_secret: config.apiSecret, secure: true });
  return cloudinary;
}

function upload(buffer: Buffer, options: Record<string, unknown>) {
  return new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
    client().uploader.upload_stream(options, (error, result) => {
      if (error || !result) reject(storageError(error));
      else resolve({ public_id: result.public_id, secure_url: result.secure_url });
    }).end(buffer);
  });
}

function storageError(error: unknown) {
  const provider = error as { http_code?: number; message?: string } | null;
  if (provider) console.error(JSON.stringify({ http_code: provider.http_code, message: provider.message }));
  return new StorageError();
}

export function uploadOriginal(buffer: Buffer, folder: string, publicId: string) {
  return upload(buffer, { resource_type: "image", type: "authenticated", folder: `originals/${folder}`, public_id: publicId, overwrite: true });
}

export function uploadPreview(buffer: Buffer, folder: string, publicId: string) {
  return upload(buffer, { resource_type: "image", type: "upload", folder: `previews/${folder}`, public_id: publicId, overwrite: true, format: "webp" });
}

export async function deleteAssets(originalPublicId: string, previewPublicId: string) {
  await Promise.all([
    client().uploader.destroy(originalPublicId, { resource_type: "image", type: "authenticated", invalidate: true }),
    client().uploader.destroy(previewPublicId, { resource_type: "image", type: "upload", invalidate: true }),
  ]);
}

export async function uploadPhotoAssets(original: Buffer, preview: Buffer, folder: string, publicId: string) {
  const originalAsset = await uploadOriginal(original, folder, publicId);
  try {
    const previewAsset = await uploadPreview(preview, folder, publicId);
    return { originalAsset, previewAsset };
  } catch (error) {
    await deleteOriginal(originalAsset.public_id);
    throw error;
  }
}

export function deleteOriginal(originalPublicId: string) {
  return client().uploader.destroy(originalPublicId, { resource_type: "image", type: "authenticated", invalidate: true });
}

export function privateDownloadUrl(publicId: string, format: string, attachment = false) {
  return client().utils.private_download_url(publicId, format, {
    resource_type: "image", type: "authenticated", expires_at: Math.floor(Date.now() / 1000) + 120, attachment,
  });
}
