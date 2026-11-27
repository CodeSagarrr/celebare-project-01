import assert from "node:assert/strict";
import { test } from "node:test";

const baseUrl = process.env.E2E_BASE_URL;
const photographers = ["photo-asha", "photo-rohan"] as const;
const expected = {
  success: { orderStatus: "PAID", paymentStatus: "MATCHED", previousPaymentStatus: null },
  "fake-sender": { orderStatus: "PENDING", paymentStatus: "REJECTED", previousPaymentStatus: null },
  duplicate: { orderStatus: "PAID", paymentStatus: "DUPLICATE", previousPaymentStatus: "MATCHED" },
  late: { orderStatus: "EXPIRED", paymentStatus: "LATE", previousPaymentStatus: null },
  "wrong-amount": { orderStatus: "PENDING", paymentStatus: "UNMATCHED", previousPaymentStatus: null },
  "wrong-receiver": { orderStatus: "PENDING", paymentStatus: "REJECTED", previousPaymentStatus: null },
} as const;

test("both photographers pass all six payment cases in parallel", { skip: !baseUrl }, async () => {
  const outcomes = await Promise.all(photographers.flatMap((photographerId) =>
    Object.entries(expected).map(async ([demoCase, result]) => {
      const response = await fetch(`${baseUrl}/api/dev/simulate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photographerId, case: demoCase }),
      });
      const body = await response.json();
      assert.equal(response.status, 200, `${photographerId}/${demoCase}: ${JSON.stringify(body)}`);
      assert.equal(body.photographerId, photographerId);
      assert.equal(body.case, demoCase);
      assert.equal(body.orderStatus, result.orderStatus, `${photographerId}/${demoCase} order`);
      assert.equal(body.paymentStatus, result.paymentStatus, `${photographerId}/${demoCase} payment`);
      assert.equal(body.previousPaymentStatus, result.previousPaymentStatus, `${photographerId}/${demoCase} replay`);
      return body;
    }),
  ));
  assert.equal(outcomes.length, 12);
});
