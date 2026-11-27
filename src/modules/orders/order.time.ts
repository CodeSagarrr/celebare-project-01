export const orderDurationMs = 5 * 60 * 1000;

export function orderExpiresAt(now: Date) {
  return new Date(now.getTime() + orderDurationMs);
}
