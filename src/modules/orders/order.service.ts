import { createOrderSchema } from "./order.schema";
import * as orderRepo from "./order.repo";
import { buildUpiLink, buildUpiQrDataUrl } from "@/src/shared/upi";
import { OrderStatus } from "@/src/app/generated/prisma/enums";
import { orderTotalPaise } from "./order.total";

export async function createOrder(input: typeof createOrderSchema._output) {
  const { eventId, photoIds } = input;
  const event = await orderRepo.getEventForOrder(eventId);
  if (!event) return { error: "Event not found", status: 404 as const };
  const photos = await orderRepo.getEventPhotoIds(eventId, photoIds);
  if (photos.length !== new Set(photoIds).size)
    return { error: "Photos must belong to this event", status: 400 as const };

  const totalPaise = orderTotalPaise(photos.length, event.pricePaise);
  for (let suffix = 1; suffix <= 99; suffix += 1) {
    const amountPaise = await orderRepo.findAvailablePaise(totalPaise, suffix);
    if (amountPaise === null) break;
    const inserted = await orderRepo.insertOrder({
      photographerId: event.photographer.id,
      eventId,
      amountPaise,
      photoIds: photos.map(({ id }) => id),
    });
    if (inserted.conflict) {
      suffix = amountPaise - totalPaise;
      continue;
    }
    if (!inserted.order) continue;
    const upiLink = buildUpiLink({
      upiId: event.photographer.upiId,
      name: event.photographer.name,
      amountPaise,
      orderId: inserted.order.id,
    });
    return {
      result: {
        orderId: inserted.order.id,
        amountPaise,
        upiLink,
        qr: await buildUpiQrDataUrl(upiLink),
        expiresAt: inserted.order.expiresAt,
      },
      status: 201 as const,
    };
  }
  return { error: "busy", status: 409 as const };
}

export function getOrderStatus(status: OrderStatus, expiresAt: Date, now = new Date()) {
  return status === OrderStatus.PENDING && now >= expiresAt ? OrderStatus.EXPIRED : status;
}

export async function getCheckout(orderId: string) {
  const order = await orderRepo.getOrder(orderId);
  if (!order) return null;
  const upiLink = buildUpiLink({
    upiId: order.photographer.upiId,
    name: order.photographer.name,
    amountPaise: order.amountPaise,
    orderId,
  });
  return {
    order,
    snapshot: {
      orderId,
      status: getOrderStatus(order.status, order.expiresAt),
      amountPaise: order.amountPaise,
      expiresAt: order.expiresAt,
      upiLink,
      qr: await buildUpiQrDataUrl(upiLink),
    },
  };
}

export const listOrders = orderRepo.listOrders;
export function listDashboardData(input: Parameters<typeof orderRepo.listDashboardData>[0]) {
  return orderRepo.listDashboardData(input);
}
export const listDashboardEvents = orderRepo.listDashboardEvents;
