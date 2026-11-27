import assert from "node:assert/strict";
import { test } from "node:test";
import { OrderStatus } from "@/src/app/generated/prisma/enums";
import { getOrderStatus } from "./order.service";

test("pending expires at the exact server deadline while paid remains paid", () => {
  const deadline = new Date("2026-11-26T12:05:00.000Z");
  assert.equal(getOrderStatus(OrderStatus.PENDING, deadline, deadline), OrderStatus.EXPIRED);
  assert.equal(getOrderStatus(OrderStatus.PAID, deadline, new Date("2026-11-26T12:10:00.000Z")), OrderStatus.PAID);
});
