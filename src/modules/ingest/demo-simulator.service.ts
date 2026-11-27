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

export async function simulatePayment(
  photographerId: "photo-asha" | "photo-rohan",
  demoCase: DemoCase,
  useLatestPendingOrder = false,
) {
  const pendingOrder = useLatestPendingOrder
    ? await simulatorRepo.findLatestPendingOrder()
    : null;
  const targetPhotographerId = pendingOrder && isDemoPhotographerId(pendingOrder.photographerId)
    ? pendingOrder.photographerId
    : photographerId;
  const photographer = await simulatorRepo.findDemoPhotographer(targetPhotographerId);
  if (!photographer) throw new Error("Seed this photographer with an event photo first");
  const event = photographer.events[0];
  const photo = event?.photos[0];
  let orderId = pendingOrder?.id;
  let amountPaise = pendingOrder?.amountPaise;
  let expiresAt = pendingOrder?.expiresAt;
  if (!pendingOrder) {
    if (!event || !photo) throw new Error("Seed this photographer with an event photo first");
    const created = await createOrder({ eventId: event.id, photoIds: [photo.id] });
    if ("error" in created) throw new Error("Could not create a simulator order");
    orderId = created.result.orderId;
    amountPaise = created.result.amountPaise;
    expiresAt = created.result.expiresAt;
  }
  if (!orderId || amountPaise === undefined || !expiresAt)
    throw new Error("Could not prepare a simulator order");

  const bank: DemoBank = photographer.bankCode === "DEMO_A" ? "a" : "b";
  const transactionTime = demoCase === "late"
    ? new Date(expiresAt.getTime() + 6000)
    : new Date();
  const rawEmail = await makeDemoEmail({
    from: demoCase === "fake-sender" ? "fraud@unknown.example.test" : `alerts@bank-${bank}.example.test`,
    inboxAddress: photographer.inboxAddress,
    receiverUpiId: demoCase === "wrong-receiver" ? `${photographer.upiId}.wrong` : photographer.upiId,
    bank,
    amountPaise: demoCase === "wrong-amount" ? amountPaise + 1000 : amountPaise,
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
    orderId,
    paymentId,
  });
  return {
    photographerId,
    orderId,
    case: demoCase,
    ...result,
    previousPaymentStatus: firstResult?.status ?? null,
  };
}

function isDemoPhotographerId(id: string): id is "photo-asha" | "photo-rohan" {
  return id === "photo-asha" || id === "photo-rohan";
}

async function processEmail(rawEmail: string, inboxAddress: string) {
  const payment = await acceptIncomingEmail(rawEmail, inboxAddress);
  await processIncomingEmail(payment.id, rawEmail, inboxAddress);
  return payment.id;
}
