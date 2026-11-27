import { db } from "@/src/shared/db";

export function findDemoPhotographer(photographerId: "photo-asha" | "photo-rohan") {
  return db.photographer.findFirst({
    where: { id: photographerId },
    select: {
      id: true,
      name: true,
      upiId: true,
      inboxAddress: true,
      bankCode: true,
      events: {
        where: { photos: { some: {} } },
        orderBy: { name: "asc" },
        take: 1,
        select: { id: true, photos: { take: 1, select: { id: true } } },
      },
    },
  });
}

export async function readSimulationResult(input: {
  photographerId: string;
  orderId: string;
  paymentId: string;
}) {
  const [order, payment] = await Promise.all([
    db.order.findFirst({ where: { id: input.orderId, photographerId: input.photographerId }, select: { status: true } }),
    db.payment.findFirst({ where: { id: input.paymentId, photographerId: input.photographerId }, select: { status: true } }),
  ]);
  return { orderStatus: order?.status ?? null, paymentStatus: payment?.status ?? null };
}

export function readPaymentStatus(photographerId: string, paymentId: string) {
  return db.payment.findFirst({ where: { id: paymentId, photographerId }, select: { status: true } });
}
