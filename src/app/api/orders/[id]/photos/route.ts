import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { OrderStatus } from "../../../../../app/generated/prisma/enums";
import { db } from "@/src/lib/db";

// Binds a short-lived token to one order and one photo.
function signature(orderId: string, photoId: string, expires: string): string {
  return createHmac(
    "sha256",
    process.env.PHOTO_LINK_SECRET ?? "local-demo-photo-secret",
  )
    .update(`${orderId}:${photoId}:${expires}`)
    .digest("hex");
}

// Lists only purchased photos and signs each link for two minutes.
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await context.params;
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { photos: { include: { photo: true } } },
  });
  if (!order || order.status !== OrderStatus.PAID) {
    return NextResponse.json(
      { error: "Photos are available only for paid orders" },
      { status: 403 },
    );
  }

  const query = new URL(request.url).searchParams;
  const photoId = query.get("photoId");
  if (photoId) {
    const expires = query.get("expires") ?? "";
    const token = query.get("token") ?? "";
    const expected = signature(orderId, photoId, expires);
    const valid =
      /^\d+$/.test(expires) &&
      Number(expires) > Date.now() &&
      Buffer.byteLength(token) === Buffer.byteLength(expected) &&
      timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    const photo = order.photos.find(
      (entry) => entry.photoId === photoId,
    )?.photo;
    if (!valid || !photo)
      return NextResponse.json(
        { error: "Photo link expired or invalid" },
        { status: 403 },
      );
    return NextResponse.json({
      photoId: photo.id,
      storageKey: photo.storageKey,
      expiresAt: new Date(Number(expires)).toISOString(),
    });
  }

  const links = order.photos.map(({ photo }) => {
    const expires = String(Date.now() + 2 * 60 * 1000);
    const token = signature(orderId, photo.id, expires);
    return {
      photoId: photo.id,
      url: `/api/orders/${orderId}/photos?photoId=${photo.id}&expires=${expires}&token=${token}`,
    };
  });
  return NextResponse.json({ photos: links });
}
