import { db } from "@/src/shared/db";

export function createEvent(data: {
  photographerId: string;
  name: string;
  slug: string;
  pricePaise: number;
}) {
  return db.event.create({
    data,
    include: { photos: { select: { id: true, previewUrl: true } } },
  });
}

export function listEvents(photographerId: string) {
  return db.event.findMany({
    where: { photographerId },
    include: { photos: { select: { id: true, previewUrl: true } } },
  });
}

export function listDashboardOrders(photographerId: string) {
  return Promise.all([
    db.order.findMany({
      where: { photographerId },
      include: {
        event: { select: { name: true } },
        photographer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.payment.findMany({
      where: { photographerId },
      include: { photographer: { select: { name: true } } },
      orderBy: { receivedAt: "desc" },
    }),
  ]);
}
