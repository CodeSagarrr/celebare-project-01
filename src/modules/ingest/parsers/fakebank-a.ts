import type { BankTransaction } from "./index";

// Reads the labeled plain-text notice used by demo bank A.
export function parseFakeBankA(text: string): BankTransaction {
  const amount = text.match(/Amount:\s*(?:INR\s*)?(\d+)\.(\d{2})/i);
  const utr = text.match(/UTR:\s*([A-Z0-9]+)/i);
  const txnTime = text.match(/Transaction time:\s*(\S+)/i);
  const receiver = text.match(/To:\s*(\S+)/i);
  if (!amount || !utr || !txnTime || !receiver)
    throw new Error("Bank A notice is missing transaction details");
  const date = new Date(txnTime[1]);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid transaction time");
  return {
    amountPaise: Number(amount[1]) * 100 + Number(amount[2]),
    utr: utr[1],
    txnTime: date,
    receiverUpiId: receiver[1],
    credited: /Status:\s*CREDITED/i.test(text),
  };
}
