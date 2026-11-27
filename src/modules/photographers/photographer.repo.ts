import { db } from "@/src/shared/db";

export async function createPhotographer(data: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  slug: string;
  upiId: string;
  bankCode: string;
  inboxAddress: string;
}) {
  return db.photographer.create({
    data,
    select: { id: true, name: true, email: true, inboxAddress: true },
  });
}

export async function listPhotographers() {
  return db.photographer.findMany({
    select: {
      id: true,
      name: true,
      upiId: true,
      events: { select: { id: true, name: true, pricePaise: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export function listPhotographerCatalog() {
  return db.photographer.findMany({
    select: {
      id: true,
      name: true,
      events: {
        select: {
          id: true,
          slug: true,
          name: true,
          pricePaise: true,
          photos: {
            where: { previewUrl: { not: null } },
            select: { id: true, previewUrl: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export function findPublicEventBySlug(slug: string) {
  return db.event.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      pricePaise: true,
      photographer: { select: { name: true } },
      photos: {
        where: { previewUrl: { not: null } },
        select: { id: true, previewUrl: true },
      },
    },
  });
}
