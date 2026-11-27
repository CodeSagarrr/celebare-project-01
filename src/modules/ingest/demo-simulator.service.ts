import { nanoid } from "nanoid";
import { createOrder } from "@/src/modules/orders/order.service";
import { acceptIncomingEmail, processIncomingEmail } from "./ingest.service";
import { makeDemoEmail, type DemoBank } from "./demo-email";
import * as simulatorRepo from "./demo-simulator.repo";
import type { DemoCase } from "./demo-simulator.schema";

export async function listDemoPhotographers() {
  return Promise.all([
    simulatorRepo.findDemoPhotographer("photo-asha"),
    simulatorRepo.findDemoPhotographer("photo-rohan"),
  ]).then((rows) => rows.filter((row) => row !== null).map(({ id, name }) => ({ id, name })));
}

export async function simulatePayment(photographerId: "photo-asha" | "photo-rohan", demoCase: DemoCase) {
  const photographer = await simulatorRepo.findDemoPhotographer(photographerId);
  const event = photographer?.events[0];
  const photo = event?.photos[0];
  if (!photographer || !event || !photo) throw new Error("Seed this photographer with an event photo first");
  const created = await createOrder({ eventId: event.id, photoIds: [photo.id] });
  if ("error" in created) throw new Error("Could not create a simulator order");

  const bank: DemoBank = photographer.bankCode === "DEMO_A" ? "a" : "b";
  const transactionTime = demoCase === "late"
    ? new Date(created.result.expiresAt.getTime() + 6000)
    : new Date();
  const rawEmail = await makeDemoEmail({
    from: demoCase === "fake-sender" ? "fraud@unknown.example.test" : `alerts@bank-${bank}.example.test`,
    inboxAddress: photographer.inboxAddress,
    receiverUpiId: demoCase === "wrong-receiver" ? `${photographer.upiId}.wrong` : photographer.upiId,
    bank,
    amountPaise: demoCase === "wrong-amount" ? created.result.amountPaise + 1000 : created.result.amountPaise,
    utr: `DEMO${nanoid(12).toUpperCase()}`,
    txnTime: transactionTime,
    signed: demoCase !== "fake-sender",
  });
  const firstPaymentId = await processEmail(rawEmail, photographer.inboxAddress);
  const firstResult = demoCase === "duplicate"
    ? await simulatorRepo.readPaymentStatus(photographer.id, firstPaymentId)
    : null;
  const paymentId = demoCase === "duplicate"
    ? await processEmail(rawEmail, photographer.inboxAddress)
    : firstPaymentId;
  const result = await simulatorRepo.readSimulationResult({
    photographerId: photographer.id,
    orderId: created.result.orderId,
    paymentId,
  });
  return {
    photographerId,
    case: demoCase,
    ...result,
    previousPaymentStatus: firstResult?.status ?? null,
  };
}

async function processEmail(rawEmail: string, inboxAddress: string) {
  const payment = await acceptIncomingEmail(rawEmail, inboxAddress);
  await processIncomingEmail(payment.id, rawEmail, inboxAddress);
  return payment.id;
}
