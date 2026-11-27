import { NextResponse } from "next/server";
import * as orderService from "@/src/modules/orders/order.service";

// Returns the database order state with expiry computed from server time.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const checkout = await orderService.getCheckout(id);
  if (!checkout) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(
    checkout.snapshot,
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
