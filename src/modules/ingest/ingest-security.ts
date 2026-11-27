import { timingSafeEqual } from "node:crypto";

const windowMs = 60_000;
const maxRequests = 30;
const attempts = new Map<string, number[]>();

export function matchesIngestSecret(expected: string, received: string | null) {
  if (!received) return false;
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

export function allowIngestRequest(key: string, now = Date.now()) {
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= maxRequests) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 10_000) {
    for (const [entry, times] of attempts) {
      if (!times.length || now - times[times.length - 1] >= windowMs) attempts.delete(entry);
    }
  }
  return true;
}
