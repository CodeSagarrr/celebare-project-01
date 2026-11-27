import { test } from "node:test";
import assert from "node:assert/strict";
import { allowIngestRequest, matchesIngestSecret } from "./ingest-security";

test("ingest secret comparison rejects missing, wrong, and differently sized values", () => {
  assert.equal(matchesIngestSecret("shared-secret", "shared-secret"), true);
  assert.equal(matchesIngestSecret("shared-secret", "wrong-secret"), false);
  assert.equal(matchesIngestSecret("shared-secret", "short"), false);
  assert.equal(matchesIngestSecret("shared-secret", null), false);
});

test("ingest rate limit allows thirty requests per minute and resets", () => {
  const key = `test-${Math.random()}`;
  for (let i = 0; i < 30; i += 1) assert.equal(allowIngestRequest(key, 1000 + i), true);
  assert.equal(allowIngestRequest(key, 1031), false);
  assert.equal(allowIngestRequest(key, 61_001), true);
});
