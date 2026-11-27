import { Prisma } from "@/src/app/generated/prisma/client";
import { OrderStatus, PaymentStatus } from "@/src/app/generated/prisma/enums";
import { db } from "@/src/shared/db";
import { decidePaymentMatch } from "./match-rules";

export type MatchPaymentInput = {
  paymentId: string;
  photographerId: string;
  amountPaise: number;
  utr: string;
  txnTime: Date;
};

type LockedOrder = { id: string; expiresAt: Date };

export async function matchPayment(input: MatchPaymentInput): Promise<PaymentStatus> {
  if (await db.payment.findUnique({ where: { utr: input.utr }, select: { id: true } })) {
    return updateDuplicate(input.paymentId);
  }
  try {
    return await db.$transaction(async (tx) => {
      const [order] = await tx.$queryRaw<LockedOrder[]>(Prisma.sql`
        SELECT "id", "expiresAt" FROM "Order"
        WHERE "photographerId" = ${input.photographerId}
          AND "amountPaise" = ${input.amountPaise}
          AND "status" = 'PENDING'
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE
      `);
      const decision = decidePaymentMatch({ duplicateUtr: false, order, txnTime: input.txnTime });
      if (decision === "UNMATCHED") {
        await tx.payment.update({ where: { id: input.paymentId }, data: paymentFields(input, {
          status: PaymentStatus.UNMATCHED,
          reason: "No matching pending order; refund may be needed",
        }) });
        return PaymentStatus.UNMATCHED;
      }
      if (!order) throw new Error("Locked order missing");
      if (decision === "LATE") {
        await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.EXPIRED } });
        await tx.payment.update({ where: { id: input.paymentId }, data: paymentFields(input, {
          status: PaymentStatus.LATE,
          reason: "Transaction arrived after order expiry",
        }) });
        return PaymentStatus.LATE;
      }
      await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.PAID, paidAt: new Date() } });
      await tx.payment.update({ where: { id: input.paymentId }, data: paymentFields(input, {
        orderId: order.id,
        status: PaymentStatus.MATCHED,
        reason: null,
      }) });
      return PaymentStatus.MATCHED;
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    return updateDuplicate(input.paymentId);
  }
}

function paymentFields(
  input: MatchPaymentInput,
  result: { orderId?: string; status: PaymentStatus; reason: string | null },
) {
  return {
    utr: result.status === PaymentStatus.DUPLICATE ? null : input.utr,
    photographerId: input.photographerId,
    amountPaise: input.amountPaise,
    txnTime: input.txnTime,
    status: result.status,
    reason: result.reason,
    ...(result.orderId ? { orderId: result.orderId } : {}),
  };
}

async function updateDuplicate(paymentId: string) {
  await db.payment.update({
    where: { id: paymentId },
    data: { utr: null, status: PaymentStatus.DUPLICATE, reason: "UTR was already used" },
  });
  return PaymentStatus.DUPLICATE;
}
