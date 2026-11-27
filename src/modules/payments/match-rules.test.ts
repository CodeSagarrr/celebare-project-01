import assert from "node:assert/strict";
import { test } from "node:test";
import { decidePaymentMatch } from "./match-rules";

const expiresAt = new Date("2026-11-27T12:00:00.000Z");

test("match rules prioritize duplicate UTRs", () => {
  assert.equal(decidePaymentMatch({ duplicateUtr: true, order: { expiresAt }, txnTime: expiresAt }), "DUPLICATE");
});

test("match rules return unmatched when no pending order exists", () => {
  assert.equal(decidePaymentMatch({ duplicateUtr: false, order: null, txnTime: expiresAt }), "UNMATCHED");
});

test("match rules allow the five second expiry buffer", () => {
  assert.equal(decidePaymentMatch({ duplicateUtr: false, order: { expiresAt }, txnTime: new Date(expiresAt.getTime() + 5000) }), "MATCHED");
  assert.equal(decidePaymentMatch({ duplicateUtr: false, order: { expiresAt }, txnTime: new Date(expiresAt.getTime() + 5001) }), "LATE");
});
