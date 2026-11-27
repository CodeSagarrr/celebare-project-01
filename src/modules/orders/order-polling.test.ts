import assert from "node:assert/strict";
import { test } from "node:test";
import type { OrderSnapshot } from "@/src/lib/api";
import { startPaymentPolling } from "./order-polling";

const pending: OrderSnapshot = {
  orderId: "order-1",
  status: "PENDING",
  amountPaise: 501,
  expiresAt: "2026-11-25T12:00:00.000Z",
  upiLink: "upi://pay",
  qr: "data:image/png;base64,",
};
const paid = { ...pending, status: "PAID" as const };
const expired = { ...pending, status: "EXPIRED" as const };

function controlledDependencies(readOrder: () => Promise<OrderSnapshot>) {
  const scheduled: Array<() => void> = [];
  return {
    scheduled,
    dependencies: {
      readOrder: async () => readOrder(),
      readPhotos: async () => [],
      schedule: (callback: () => void) => {
        scheduled.push(callback);
        return 1 as unknown as ReturnType<typeof setTimeout>;
      },
      cancel: () => undefined,
    },
  };
}

test("publishes PAID immediately when the first status read sees a confirmed payment", async () => {
  const { dependencies } = controlledDependencies(async () => paid);
  let observed: OrderSnapshot | undefined;
  let photosLoaded = false;
  const stop = startPaymentPolling("order-1", (order) => { observed = order; },
    () => { photosLoaded = true; }, (error) => { throw error; }, dependencies);
  await new Promise((resolve) => setImmediate(resolve));
  stop();
  assert.equal(observed?.status, "PAID");
  assert.equal(photosLoaded, true);
});

test("continues polling a pending order and publishes PAID on the next read", async () => {
  let current = pending;
  const { dependencies, scheduled } = controlledDependencies(async () => current);
  let observed: OrderSnapshot | undefined;
  const stop = startPaymentPolling("order-1", (order) => { observed = order; },
    () => undefined, (error) => { throw error; }, dependencies);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(observed?.status, "PENDING");
  current = paid;
  scheduled.shift()?.();
  await new Promise((resolve) => setImmediate(resolve));
  stop();
  assert.equal(observed?.status, "PAID");
});

test("stops polling when the order expires", async () => {
  const { dependencies, scheduled } = controlledDependencies(async () => expired);
  let observed: OrderSnapshot | undefined;
  startPaymentPolling("order-1", (order) => { observed = order; }, () => undefined, () => undefined, dependencies);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(observed?.status, "EXPIRED");
  assert.equal(scheduled.length, 0);
});
