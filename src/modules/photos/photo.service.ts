import { nanoid } from "nanoid";
import sharp from "sharp";
import * as photoRepo from "./photo.repo";
import { photoUploadSchema } from "./photo.schema";
import { deleteAssets, privateDownloadUrl, StorageError, uploadPhotoAssets } from "./storage";

const maxBytes = 10 * 1024 * 1024;
const formats: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};
type ValidatedFiles =
  | { files: Array<{ bytes: Buffer }> }
  | { error: string; status: 400 };

function makeWatermark() {
  return Buffer.from(
    '<svg width="600" height="80"><text x="18" y="54" fill="white" fill-opacity="0.8" font-size="30" font-family="Arial">FRAMEPAY PREVIEW</text></svg>',
  );
}

async function makePreview(bytes: Buffer) {
  return sharp(bytes)
    .resize({ width: 600, withoutEnlargement: true })
    .blur(8)
    .composite([{ input: makeWatermark(), gravity: "southwest" }])
    .webp({ quality: 76 })
    .toBuffer();
}

export async function uploadEventPhotos(
  eventId: string,
  photographerId: string,
  files: File[],
  stablePublicIds?: string[],
) {
  const parsed = photoUploadSchema.safeParse({ files });
  if (!parsed.success)
    return { error: "Choose between 1 and 20 photos", status: 400 as const };
  if (!(await photoRepo.ownsEvent(eventId, photographerId)))
    return { error: "Event not found", status: 404 as const };
  const validated = await validateFiles(parsed.data.files);
  if ("error" in validated) return validated;
  const uploaded = [];
  for (const [index, item] of validated.files.entries()) {
    const stableId = stablePublicIds?.[index]
      ?.replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-");
    const assetId = stableId || nanoid(18);
    const folder = `${photographerId}/${eventId}`;
    uploaded.push(
      await storePhoto(item.bytes, folder, assetId, eventId, photographerId),
    );
  }
  return { photos: uploaded, status: 201 as const };
}

async function validateFiles(files: File[]): Promise<ValidatedFiles> {
  const validated: Array<{ bytes: Buffer }> = [];
  for (const file of files) {
    if (!(file.type in formats) || file.size > maxBytes || file.size === 0)
      return {
        error: "Photos must be JPEG, PNG, or WebP and at most 10 MB",
        status: 400 as const,
      };
    const bytes = Buffer.from(await file.arrayBuffer());
    let metadata: import("sharp").Metadata;
    try {
      metadata = await sharp(bytes).metadata();
    } catch {
      return { error: "Invalid image file", status: 400 as const };
    }
    if (metadata.format !== formats[file.type])
      return {
        error: "Photo content does not match its declared image format",
        status: 400 as const,
      };
    validated.push({ bytes });
  }
  return { files: validated };
}

async function storePhoto(
  bytes: Buffer,
  folder: string,
  assetId: string,
  eventId: string,
  photographerId: string,
) {
  const preview = await makePreview(bytes);
  const assets = await uploadPhotoAssets(bytes, preview, folder, assetId);
  let previewId = "";
  try {
    const publicPreview = assets.previewAsset;
    previewId = publicPreview.public_id;
    const photo = await photoRepo.savePhoto({
      id: nanoid(),
      eventId,
      photographerId,
      originalPublicId: assets.originalAsset.public_id,
      previewPublicId: previewId,
      previewUrl: publicPreview.secure_url,
    });
    if (!photo) throw new Error("Event not found");
    return photo;
  } catch (error) {
    if (previewId)
      await deleteAssets(assets.originalAsset.public_id, previewId);
    if (error instanceof StorageError) throw error;
    throw error;
  }
}

export async function getPaidPhotoLinks(orderId: string) {
  const order = await photoRepo.getPaidOrderPhotos(orderId);
  if (!order) return null;
  const photos = order.photos.map(({ photo }) => {
    return {
      photoId: photo.id,
      viewUrl: `/api/orders/${orderId}/photos/${photo.id}/view`,
      downloadUrl: `/api/orders/${orderId}/photos/${photo.id}/download`,
    };
  });
  return { photos };
}

export async function getPaidPhotoRedirect(orderId: string, photoId: string, attachment: boolean) {
  const photo = await photoRepo.getPaidPhoto(orderId, photoId);
  if (!photo?.originalPublicId) return null;
  return privateDownloadUrl(photo.originalPublicId, "jpg", attachment);
}
