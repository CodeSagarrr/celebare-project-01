import { dkimVerify } from "mailauth/lib/dkim/verify";
import PostalMime from "postal-mime";
import { parseBankEmail, type BankTransaction } from "./parsers";
import * as ingestRepo from "./ingest.repo";

const demoPublicKey = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuoT/RORuFWKae4HybUqW\nYf5BKUi8u65CFy6cp22VjgjNlrwaR79IsklPMpPwpIFqbz5xlRhqmYy5G8sqa4jh\nbNsLAVGbDcH3GUQi8THEPFTTCBwdgClXcFOWBoGLy+jqWmDrqTSNrZCRA8yCQzbY\nzMd2YDlabcJAYPnR7CRZgHTKSDympEEXWugwguwSzR+ISSda6WjFOjAl5uhf7AqY\n4Akqlr/wANOxEmAFKD0JKXeGk5EuhaK4/jmLWcG2aVZaVFMdd9M03NlFEu2xDCOp\n4CX1wEIDd+DAFzpx6SCJ4H42yzv36acIv0g4LpQc1fecGp/9kcPX7lJcJTyUMIsV\nWwIDAQAB\n-----END PUBLIC KEY-----\n";

export type VerifiedEmail = { photographerId: string; transaction: BankTransaction };

export async function verifyEmail(rawEmail: string, inboxAddress: string): Promise<VerifiedEmail> {
  const email = await PostalMime.parse(rawEmail);
  const fromAddress = email.from?.address?.toLowerCase() ?? "";
  const senderDomain = fromAddress.split("@").pop() ?? "";
  const bank = await ingestRepo.getAllowedBank(senderDomain);
  if (!bank) throw new Error("Sender domain is not allowlisted");
  if (!(await verifyDkim(rawEmail, bank.senderDomain))) throw new Error("DKIM verification failed");
  const transaction = parseBankEmail(bank.parserKey, email.text ?? "");
  const photographer = await ingestRepo.getPhotographerInbox(inboxAddress);
  if (!photographer || photographer.bankCode !== bank.code)
    throw new Error("Inbox is not registered to this bank");
  if (transaction.receiverUpiId.toLowerCase() !== photographer.upiId.toLowerCase())
    throw new Error("Receiver UPI ID does not match photographer");
  if (!transaction.credited) throw new Error("Transaction was not credited");
  if (!transaction.utr) throw new Error("UTR is missing");
  return { photographerId: photographer.id, transaction };
}

async function verifyDkim(rawEmail: string, expectedDomain: string): Promise<boolean> {
  const result = await dkimVerify(rawEmail, {
    resolver: async (name) => {
      if (name !== `demo._domainkey.${expectedDomain}`) throw new Error("Unknown demo DKIM key");
      const publicKey = demoPublicKey.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
      return [[`v=DKIM1; k=rsa; p=${publicKey}`]];
    },
  });
  return result.results.some(
    (signature) =>
      signature.status.result === "pass" &&
      signature.signingDomain?.toLowerCase() === expectedDomain.toLowerCase(),
  );
}
