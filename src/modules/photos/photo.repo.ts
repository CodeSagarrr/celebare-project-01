import { OrderStatus } from "@/src/app/generated/prisma/enums";
import { db } from "@/src/shared/db";

export function ownsEvent(eventId: string, photographerId: string) {
  return db.event.findFirst({ where: { id: eventId, photographerId }, select: { id: true } });
}

export async function savePhoto(input: {
  eventId: string;
  photographerId: string;
  id: string;
  originalPublicId: string;
  previewPublicId: string;
  previewUrl: string;
}) {
  const event = await db.event.findFirst({
    where: { id: input.eventId, photographerId: input.photographerId },
    select: { id: true },
  });
  if (!event) return null;
  const existing = await db.photo.findFirst({
    where: { eventId: event.id, originalPublicId: input.originalPublicId },
    select: { id: true },
  });
  const data = {
    eventId: event.id,
    originalPublicId: input.originalPublicId,
    previewUrl: input.previewUrl,
    storageKey: input.previewPublicId,
  };
  return existing
    ? db.photo.update({ where: { id: existing.id }, data, select: { id: true, previewUrl: true } })
    : db.photo.create({ data: { id: input.id, ...data }, select: { id: true, previewUrl: true } });
}

export function getPaidOrderPhotos(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId, status: OrderStatus.PAID },
    include: { photos: { include: { photo: true } } },
  });
}

export async function getPaidPhoto(orderId: string, photoId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId, status: OrderStatus.PAID },
    select: { photos: { where: { photoId }, select: { photo: { select: { id: true, originalPublicId: true } } } } },
  });
  return order?.photos[0]?.photo ?? null;
}
