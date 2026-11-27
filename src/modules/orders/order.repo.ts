import { Prisma } from "@/src/app/generated/prisma/client";
import { OrderStatus, PaymentStatus } from "@/src/app/generated/prisma/enums";
import { db } from "@/src/shared/db";
import { nanoid } from "nanoid";
import { orderExpiresAt } from "./order.time";

export async function getEventForOrder(eventId: string) {
  return db.event.findUnique({
    where: { id: eventId },
    include: { photographer: { select: { id: true, name: true, upiId: true } } },
  });
}

export function getEventPhotoIds(eventId: string, photoIds: string[]) {
  return db.photo.findMany({
    where: { id: { in: photoIds }, eventId },
    select: { id: true },
  });
}

export async function findAvailablePaise(totalPaise: number, startSuffix: number) {
  const orders = await db.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      expiresAt: { gt: new Date() },
      amountPaise: { gt: totalPaise, lte: totalPaise + 99 },
    },
    select: { amountPaise: true },
  });
  const used = new Set(orders.map(({ amountPaise }) => amountPaise));
  for (let suffix = startSuffix; suffix <= 99; suffix += 1) {
    if (!used.has(totalPaise + suffix)) return totalPaise + suffix;
  }
  return null;
}

export async function insertOrder(input: {
  photographerId: string;
  eventId: string;
  amountPaise: number;
  photoIds: string[];
}) {
  try {
    const now = new Date();
    const order = await db.order.create({
      data: {
        id: nanoid(21),
        photographerId: input.photographerId,
        eventId: input.eventId,
        amountPaise: input.amountPaise,
        expiresAt: orderExpiresAt(now),
        photos: { create: input.photoIds.map((photoId) => ({ photoId })) },
      },
    });
    return { order, conflict: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return { order: null, conflict: true };
    throw error;
  }
}

export function getOrder(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: { photographer: { select: { name: true, upiId: true } } },
  });
}

export function listOrders() {
  return db.order.findMany({
    include: {
      event: { select: { name: true } },
      payment: { select: { status: true, reason: true, utr: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function listDashboardData(input: {
  photographerId: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  eventId?: string;
}) {
  const now = new Date();
  const orderStatusFilter = input.orderStatus === OrderStatus.EXPIRED
    ? { OR: [{ status: OrderStatus.EXPIRED }, { status: OrderStatus.PENDING, expiresAt: { lte: now } }] }
    : input.orderStatus === OrderStatus.PENDING
      ? { status: OrderStatus.PENDING, expiresAt: { gt: now } }
      : input.orderStatus ? { status: input.orderStatus } : {};
  return Promise.all([
    db.order.findMany({
      where: {
        photographerId: input.photographerId,
        ...orderStatusFilter,
        ...(input.eventId ? { eventId: input.eventId } : {}),
      },
      include: { event: { select: { name: true } }, photographer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.payment.findMany({
      where: {
        photographerId: input.photographerId,
        ...(input.paymentStatus ? { status: input.paymentStatus } : {}),
        ...(input.eventId ? { order: { eventId: input.eventId } } : {}),
      },
      include: { photographer: { select: { name: true } }, order: { include: { event: { select: { name: true } } } } },
      orderBy: { receivedAt: "desc" },
      take: 100,
    }),
  ]);
}

export function listDashboardEvents(photographerId: string) {
  return db.event.findMany({ where: { photographerId }, select: { id: true, name: true }, orderBy: { name: "asc" } });
}
