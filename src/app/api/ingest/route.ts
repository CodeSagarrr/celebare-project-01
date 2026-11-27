import { after, NextResponse } from "next/server";
import { ingestInputSchema } from "@/src/modules/ingest/ingest.schema";
import * as ingestService from "@/src/modules/ingest/ingest.service";
import { allowIngestRequest, matchesIngestSecret } from "@/src/modules/ingest/ingest-security";

// Stores the raw bank message before validating it so every delivery is auditable.
export async function POST(request: Request) {
  const ingestSecret =
    process.env.INGEST_SECRET ??
    (process.env.NODE_ENV === "development" ? "local-demo-secret" : "");
  if (
    !ingestSecret ||
    !matchesIngestSecret(ingestSecret, request.headers.get("x-ingest-secret"))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requestKey = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowIngestRequest(requestKey))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const payload = await request.text().catch(() => "");
  if (Buffer.byteLength(payload) > 1_100_000)
    return NextResponse.json({ error: "Email is too large" }, { status: 413 });
  let decoded: unknown;
  try {
    decoded = JSON.parse(payload);
  } catch {
    decoded = null;
  }
  const body = ingestInputSchema.safeParse(decoded);
  if (!body.success)
    return NextResponse.json(
      { error: "Expected rawEmail and to" },
      { status: 400 },
    );
  const { rawEmail, to: inboxAddress } = body.data;
  const payment = await ingestService.acceptIncomingEmail(rawEmail, inboxAddress);
  after(() => ingestService.processIncomingEmail(payment.id, rawEmail, inboxAddress));
  return NextResponse.json(
    { accepted: true, paymentId: payment.id },
    { status: 200 },
  );
}
