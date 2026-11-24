import { after, NextResponse } from "next/server";
import { PaymentStatus } from "../../../app/generated/prisma/enums";
import { z } from "zod";
import { db } from "@/src/lib/db";
import { matchPayment } from "@/src/lib/ingest/match";
import { verifyEmail } from "@/src/lib/ingest/verify";

const ingestInput = z.object({
  rawEmail: z.string().min(1),
  to: z.string().email(),
});

// Verifies a saved email and records the resulting payment outcome after the response.
async function processEmail(
  paymentId: string,
  rawEmail: string,
  inboxAddress: string,
): Promise<void> {
  try {
    const verified = await verifyEmail(rawEmail, inboxAddress);
    await matchPayment({
      paymentId,
      photographerId: verified.photographerId,
      amountPaise: verified.transaction.amountPaise,
      utr: verified.transaction.utr,
      txnTime: verified.transaction.txnTime,
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Email verification failed";
    await db.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REJECTED, reason },
    });
  }
}

// Stores the raw bank message before validating it so every delivery is auditable.
export async function POST(request: Request) {
  const ingestSecret =
    process.env.INGEST_SECRET ??
    (process.env.NODE_ENV === "development" ? "local-demo-secret" : "");
  if (
    !ingestSecret ||
    request.headers.get("x-ingest-secret") !== ingestSecret
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = ingestInput.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json(
      { error: "Expected rawEmail and to" },
      { status: 400 },
    );
  const { rawEmail, to: inboxAddress } = body.data;
  const photographer = inboxAddress
    ? await db.photographer.findUnique({ where: { inboxAddress } })
    : null;
  const payment = await db.payment.create({
    data: {
      rawEmail,
      status: PaymentStatus.REJECTED,
      reason: "Processing",
      photographerId: photographer?.id,
    },
  });
  after(() => processEmail(payment.id, rawEmail, inboxAddress));
  return NextResponse.json(
    { accepted: true, paymentId: payment.id },
    { status: 200 },
  );
}
