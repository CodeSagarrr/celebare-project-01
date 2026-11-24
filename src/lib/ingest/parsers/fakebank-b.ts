import type { BankTransaction } from "./index";

// Reads the compact semicolon notice used by demo bank B.
export function parseFakeBankB(text: string): BankTransaction {
  const fields = Object.fromEntries(
    text.split(";").map((part) => {
      const [key, ...value] = part.split("=");
      return [key?.trim().toLowerCase(), value.join("=").trim()];
    }),
  );
  const amount = fields.amount?.match(/^(\d+)\.(\d{2})$/);
  const txnTime = new Date(fields.time ?? "");
  if (!amount || !fields.utr || !fields.to || Number.isNaN(txnTime.getTime())) {
    throw new Error("Bank B notice is missing transaction details");
  }
  return {
    amountPaise: Number(amount[1]) * 100 + Number(amount[2]),
    utr: fields.utr,
    txnTime,
    receiverUpiId: fields.to,
    credited: fields.result?.toLowerCase() === "credited",
  };
}
