import assert from "node:assert/strict";
import { test } from "node:test";
import emailWorker, { type Env } from "../../../worker/email-worker";

test("Worker reads its bindings and forwards the unchanged raw email", async () => {
  const rawEmail = "From: bank@example.test\r\nTo: photo@example.test\r\nSubject: Credit\r\n\r\nRaw body stays intact.\r\n";
  const originalFetch = globalThis.fetch;
  let sentUrl = "";
  let sentHeaders = new Headers();
  let sentBody = "";
  globalThis.fetch = async (input, init) => {
    sentUrl = String(input);
    sentHeaders = new Headers(init?.headers);
    sentBody = String(init?.body);
    return new Response(null, { status: 200 });
  };
  try {
    const env: Env = { INGEST_URL: "https://app.example.test/api/ingest", INGEST_SECRET: "local-secret" };
    await emailWorker.email({ to: "photo@example.test", raw: new Response(rawEmail).body! }, env);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(sentUrl, "https://app.example.test/api/ingest");
  assert.equal(sentHeaders.get("x-ingest-secret"), "local-secret");
  assert.deepEqual(JSON.parse(sentBody), { rawEmail, to: "photo@example.test" });
});
