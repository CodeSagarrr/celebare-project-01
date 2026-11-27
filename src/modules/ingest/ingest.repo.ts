import { PaymentStatus } from "@/src/app/generated/prisma/enums";
import { db } from "@/src/shared/db";

export async function saveIncomingEmail(rawEmail: string, inboxAddress: string) {
  const photographer = await db.photographer.findUnique({
    where: { inboxAddress },
    select: { id: true },
  });
  return db.payment.create({
    data: {
      rawEmail,
      status: PaymentStatus.REJECTED,
      reason: "Processing",
      photographerId: photographer?.id,
    },
  });
}

export function getAllowedBank(senderDomain: string) {
  return db.bank.findFirst({ where: { senderDomain } });
}

export function getPhotographerInbox(inboxAddress: string) {
  return db.photographer.findUnique({ where: { inboxAddress } });
}

export function rejectPayment(paymentId: string, reason: string) {
  return db.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.REJECTED, reason },
  });
}
