import assert from "node:assert/strict";
import { test } from "node:test";
import { createOrderSchema } from "./order.schema";

test("order input requires a nonempty unique selection", () => {
  assert.equal(createOrderSchema.safeParse({ eventId: "event-1", photoIds: ["photo-1"] }).success, true);
  assert.equal(createOrderSchema.safeParse({ eventId: "event-1", photoIds: [] }).success, false);
  assert.equal(createOrderSchema.safeParse({ eventId: "event-1", photoIds: ["photo-1", "photo-1"] }).success, false);
});
