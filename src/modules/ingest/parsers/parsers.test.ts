import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBankEmail } from "./index";

test("fake bank A parser converts rupees to integer paise", () => {
  const transaction = parseBankEmail(
    "fakebank-a",
    "Amount: INR 12.34\nUTR: A123\nTransaction time: 2026-11-27T12:00:00.000Z\nTo: demo@bank\nStatus: CREDITED",
  );
  assert.equal(transaction.amountPaise, 1234);
  assert.equal(transaction.utr, "A123");
  assert.equal(transaction.receiverUpiId, "demo@bank");
  assert.equal(transaction.credited, true);
});

test("fake bank B parser returns a rejected credit status without losing the transaction", () => {
  const transaction = parseBankEmail(
    "fakebank-b",
    "amount=5.00; utr=B456; time=2026-11-27T12:00:00.000Z; to=demo@bank; result=failed",
  );
  assert.equal(transaction.amountPaise, 500);
  assert.equal(transaction.credited, false);
});

test("parser registry rejects unknown banks", () => {
  assert.throws(() => parseBankEmail("unknown", ""), /Unknown bank parser/);
});
