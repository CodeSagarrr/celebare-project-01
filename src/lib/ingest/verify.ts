import { dkimVerify } from "mailauth/lib/dkim/verify";
import PostalMime from "postal-mime";
import { db } from "@/src/lib/db";
import { parseBankEmail, type BankTransaction } from "./parsers";

const demoPublicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDiYy0pafs0SjGoIiq1fQdfTPxn
TZqeZhnp8w3j7Bv7w3HPfhNmulgcUqrGMH7db1wLyKZA8lx19PCGu0BuOMKWGFRo
vP7CgrewNdQdejCerNQUWvgBYOhiAJeqnQaC/gkoxE8N2bvS5v6bsft6DkPX6B7Y
vfG36ZpoBa4na54vzQIDAQAB
-----END PUBLIC KEY-----`;

export type VerifiedEmail = {
  photographerId: string;
  transaction: BankTransaction;
};

// Verifies sender, DKIM, parsed credit, receiver, and UTR in the required order.
export async function verifyEmail(
  rawEmail: string,
  inboxAddress: string,
): Promise<VerifiedEmail> {
  const email = await PostalMime.parse(rawEmail);
  const fromAddress = email.from?.address?.toLowerCase() ?? "";
  const senderDomain = fromAddress.split("@").pop() ?? "";
  const bank = await db.bank.findFirst({ where: { senderDomain } });
  if (!bank) throw new Error("Sender domain is not allowlisted");

  const dkim = await verifyDkim(rawEmail);
  if (!dkim) throw new Error("DKIM verification failed");

  const transaction = parseBankEmail(bank.parserKey, email.text ?? "");
  const photographer = await db.photographer.findUnique({
    where: { inboxAddress },
  });
  if (!photographer || photographer.bankCode !== bank.code)
    throw new Error("Inbox is not registered to this bank");
  if (
    transaction.receiverUpiId.toLowerCase() !== photographer.upiId.toLowerCase()
  ) {
    throw new Error("Receiver UPI ID does not match photographer");
  }
  if (!transaction.credited) throw new Error("Transaction was not credited");
  if (!transaction.utr) throw new Error("UTR is missing");
  return { photographerId: photographer.id, transaction };
}

// Checks a DKIM signature using mailauth and the clearly demo-only local test key.
export async function verifyDkim(rawEmail: string): Promise<boolean> {
  const result = await dkimVerify(rawEmail, {
    resolver: async (name) => {
      if (name !== "demo._domainkey.example.test")
        throw new Error("Unknown demo DKIM key");
      const publicKey = demoPublicKey
        .replace(/-----[^-]+-----/g, "")
        .replace(/\s/g, "");
      return [[`v=DKIM1; k=rsa; p=${publicKey}`]];
    },
  });
  return result.results.some((signature) => signature.status.result === "pass");
}
