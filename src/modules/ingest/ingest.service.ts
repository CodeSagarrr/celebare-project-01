import * as ingestRepo from "./ingest.repo";
import { verifyEmail } from "./verify.service";
import { matchPayment } from "@/src/modules/payments/payment.service";

export async function acceptIncomingEmail(rawEmail: string, inboxAddress: string) {
  return ingestRepo.saveIncomingEmail(rawEmail, inboxAddress);
}

export async function processIncomingEmail(
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
    await ingestRepo.rejectPayment(
      paymentId,
      error instanceof Error ? error.message : "Email verification failed",
    );
  }
}
