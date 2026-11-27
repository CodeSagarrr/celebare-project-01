import { nanoid } from "nanoid";
import { createPhotographerSchema } from "./photographer.schema";
import * as photographerRepo from "./photographer.repo";
import { hashPassword } from "@/src/modules/auth/password";

export async function registerPhotographer(input: unknown) {
  const parsed = createPhotographerSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input", status: 400 as const };
  try {
    const photographer = await photographerRepo.createPhotographer({
      id: nanoid(),
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
      slug: `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${nanoid(6).toLowerCase()}`,
      upiId: parsed.data.upiId,
      bankCode: parsed.data.bankCode,
      inboxAddress: parsed.data.inboxAddress,
    });
    return { photographer, status: 201 as const };
  } catch {
    return {
      error: "Photographer already exists or bank is invalid",
      status: 409 as const,
    };
  }
}

export const listPhotographers = photographerRepo.listPhotographers;
export const listPhotographerCatalog = photographerRepo.listPhotographerCatalog;

export async function getPublicEvent(slug: string) {
  const event = await photographerRepo.findPublicEventBySlug(slug);
  if (!event) return null;
  return {
    ...event,
    photos: event.photos.filter((photo): photo is { id: string; previewUrl: string } => photo.previewUrl !== null),
  };
}
