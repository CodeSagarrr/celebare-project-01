import assert from "node:assert/strict";
import { test } from "node:test";
import { orderTotalPaise } from "./order.total";

test("computes order amount from server photo count and integer price", () => {
  assert.equal(orderTotalPaise(3, 501), 1503);
});
