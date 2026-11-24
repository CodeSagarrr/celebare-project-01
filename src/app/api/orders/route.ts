import { NextResponse } from "next/server";
import { Prisma } from "../../../app/generated/prisma/client";
import { z } from "zod";
import { db } from "@/src/lib/db";
import { pickFreePaise } from "@/src/lib/orders";
import { buildUpiLink, buildUpiQrDataUrl } from "@/src/lib/upi";

const orderInput = z.object({
  eventId: z.string().min(1),
  photoIds: z.array(z.string().min(1)).min(1),
});

// Creates an order and retries the next paise amount after a unique-index race.
export async function POST(request: Request) {
  const parsed = orderInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const event = await db.event.findUnique({
    where: { id: parsed.data.eventId },
    include: { photographer: true },
  });
  if (!event)
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const photos = await db.photo.findMany({
    where: { id: { in: parsed.data.photoIds }, eventId: event.id },
    select: { id: true },
  });
  if (photos.length !== new Set(parsed.data.photoIds).size) {
    return NextResponse.json(
      { error: "Photos must belong to this event" },
      { status: 400 },
    );
  }

  const totalPaise = photos.length * event.pricePaise;
  let nextSuffix = 1;
  for (let attempt = 0; attempt < 99; attempt += 1) {
    const amountPaise = await pickFreePaise(totalPaise, nextSuffix);
    if (amountPaise === null)
      return NextResponse.json({ error: "busy" }, { status: 409 });
    const now = new Date();
    try {
      const order = await db.order.create({
        data: {
          photographerId: event.photographerId,
          eventId: event.id,
          amountPaise,
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          photos: { create: photos.map((photo) => ({ photoId: photo.id })) },
        },
      });
      const upiLink = buildUpiLink({
        upiId: event.photographer.upiId,
        name: event.photographer.name,
        amountPaise,
        orderId: order.id,
      });
      const qr = await buildUpiQrDataUrl(upiLink);
      return NextResponse.json(
        {
          orderId: order.id,
          amountPaise,
          upiLink,
          qr,
          expiresAt: order.expiresAt,
        },
        { status: 201 },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        nextSuffix = amountPaise - totalPaise + 1;
        continue;
      }
      throw error;
    }
  }
  return NextResponse.json({ error: "busy" }, { status: 409 });
}

// Lists order and payment outcomes for the simple demo dashboard.
export async function GET() {
  const orders = await db.order.findMany({
    include: {
      event: { select: { name: true } },
      payment: { select: { status: true, reason: true, utr: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
