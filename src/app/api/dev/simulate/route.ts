import { NextResponse } from "next/server";
import { simulatePaymentSchema } from "@/src/modules/ingest/demo-simulator.schema";
import { simulatePayment } from "@/src/modules/ingest/demo-simulator.service";

export async function POST(request: Request) {
  if (process.env.DEMO_MODE !== "true")
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const input = simulatePaymentSchema.safeParse(await request.json().catch(() => null));
  if (!input.success)
    return NextResponse.json({ error: "Choose a demo photographer and case" }, { status: 400 });
  try {
    return NextResponse.json(await simulatePayment(input.data.photographerId, input.data.case));
  } catch (error) {
    console.error("Demo simulation failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Could not run the demo case; seed the database and photos first" }, { status: 503 });
  }
}
