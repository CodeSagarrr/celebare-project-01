import { Prisma } from "../../app/generated/prisma/client";
import { OrderStatus, PaymentStatus } from "../../app/generated/prisma/enums";
import { db } from "@/src/lib/db";

export type MatchInput = {
  paymentId: string;
  photographerId: string;
  amountPaise: number;
  utr: string;
  txnTime: Date;
};

// Locks the matching order and records exactly one payment outcome transactionally.
export async function matchPayment(input: MatchInput): Promise<PaymentStatus> {
  try {
    return await db.$transaction(async (tx) => {
      const duplicate = await tx.payment.findUnique({
        where: { utr: input.utr },
        select: { id: true },
      });
      if (duplicate) {
        await tx.payment.update({
          where: { id: input.paymentId },
          data: {
            utr: null,
            status: PaymentStatus.DUPLICATE,
            reason: "UTR was already used",
          },
        });
        return PaymentStatus.DUPLICATE;
      }

      const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id" FROM "Order"
        WHERE "photographerId" = ${input.photographerId}
          AND "amountPaise" = ${input.amountPaise}
          AND "status" = 'PENDING'
        ORDER BY "createdAt" ASC
        FOR UPDATE
      `);
      const order = locked[0]
        ? await tx.order.findUnique({ where: { id: locked[0].id } })
        : null;
      if (!order) {
        await tx.payment.update({
          where: { id: input.paymentId },
          data: {
            utr: input.utr,
            photographerId: input.photographerId,
            amountPaise: input.amountPaise,
            txnTime: input.txnTime,
            status: PaymentStatus.UNMATCHED,
            reason: "No matching pending order; refund may be needed",
          },
        });
        return PaymentStatus.UNMATCHED;
      }

      const lateAfter = new Date(order.expiresAt.getTime() + 5000);
      if (input.txnTime > lateAfter) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.EXPIRED },
        });
        await tx.payment.update({
          where: { id: input.paymentId },
          data: {
            utr: input.utr,
            photographerId: input.photographerId,
            amountPaise: input.amountPaise,
            txnTime: input.txnTime,
            status: PaymentStatus.LATE,
            reason: "Transaction arrived after order expiry",
          },
        });
        return PaymentStatus.LATE;
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });
      await tx.payment.update({
        where: { id: input.paymentId },
        data: {
          utr: input.utr,
          photographerId: input.photographerId,
          orderId: order.id,
          amountPaise: input.amountPaise,
          txnTime: input.txnTime,
          status: PaymentStatus.MATCHED,
          reason: null,
        },
      });
      return PaymentStatus.MATCHED;
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    )
      throw error;
    await db.payment.update({
      where: { id: input.paymentId },
      data: {
        utr: null,
        status: PaymentStatus.DUPLICATE,
        reason: "UTR was already used",
      },
    });
    return PaymentStatus.DUPLICATE;
  }
}
