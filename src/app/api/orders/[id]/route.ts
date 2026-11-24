import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { getOrderStatus } from "@/src/lib/orders";
import { buildUpiLink, buildUpiQrDataUrl } from "@/src/lib/upi";

// Returns the database order state with expiry computed from server time.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const order = await db.order.findUnique({
    where: { id },
    include: { photographer: { select: { name: true, upiId: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const upiLink = buildUpiLink({ upiId: order.photographer.upiId, name: order.photographer.name, amountPaise: order.amountPaise, orderId: order.id });
  const qr = await buildUpiQrDataUrl(upiLink);
  return NextResponse.json(
    {
      orderId: order.id,
      status: getOrderStatus(order.status, order.expiresAt),
      amountPaise: order.amountPaise,
      expiresAt: order.expiresAt,
      upiLink,
      qr,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
