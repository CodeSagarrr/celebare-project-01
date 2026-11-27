export type MatchDecision = "MATCHED" | "LATE" | "DUPLICATE" | "UNMATCHED";

export function decidePaymentMatch(input: {
  duplicateUtr: boolean;
  order: { expiresAt: Date } | null;
  txnTime: Date;
  bufferMs?: number;
}): MatchDecision {
  if (input.duplicateUtr) return "DUPLICATE";
  if (!input.order) return "UNMATCHED";
  return input.txnTime.getTime() > input.order.expiresAt.getTime() + (input.bufferMs ?? 5000)
    ? "LATE"
    : "MATCHED";
}
