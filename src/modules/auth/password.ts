import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const keyLength = 64;

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, keyLength).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [salt, savedHex] = encoded.split(":");
  if (!salt || !savedHex || savedHex.length !== keyLength * 2) return false;
  const saved = Buffer.from(savedHex, "hex");
  const candidate = scryptSync(password, salt, keyLength);
  return saved.length === candidate.length && timingSafeEqual(saved, candidate);
}
