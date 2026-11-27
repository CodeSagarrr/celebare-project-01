import { NextResponse } from "next/server";
import * as orderService from "@/src/modules/orders/order.service";
import { createOrderSchema } from "@/src/modules/orders/order.schema";

// Creates an order and retries the next paise amount after a unique-index race.
export async function POST(request: Request) {
  const input = createOrderSchema.safeParse(await request.json().catch(() => null));
  if (!input.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const result = await orderService.createOrder(input.data);
  if ("error" in result)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.result, { status: result.status });
}

// Lists order and payment outcomes for the simple demo dashboard.
export async function GET() {
  const orders = await orderService.listOrders();
  return NextResponse.json(orders);
}
