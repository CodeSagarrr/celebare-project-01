import assert from "node:assert/strict";
import { test } from "node:test";
import { orderDurationMs, orderExpiresAt } from "./order.time";

test("order expiry is five minutes after server creation time", () => {
  const createdAt = new Date("2026-11-26T12:00:00.000Z");
  assert.equal(orderExpiresAt(createdAt).toISOString(), "2026-11-26T12:05:00.000Z");
  assert.equal(orderDurationMs, 300_000);
});
