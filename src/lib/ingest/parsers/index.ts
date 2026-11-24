import { parseFakeBankA } from "./fakebank-a";
import { parseFakeBankB } from "./fakebank-b";

export type BankTransaction = {
  amountPaise: number;
  utr: string;
  txnTime: Date;
  receiverUpiId: string;
  credited: boolean;
};

// Selects the parser that matches a bank's configured parser key.
export function parseBankEmail(parserKey: string, text: string): BankTransaction {
  if (parserKey === "fakebank-a") return parseFakeBankA(text);
  if (parserKey === "fakebank-b") return parseFakeBankB(text);
  throw new Error("Unknown bank parser");
}
