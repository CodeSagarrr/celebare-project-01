import { db } from "@/src/shared/db";

export function getSettings(photographerId: string) {
  return Promise.all([
    db.photographer.findUnique({
      where: { id: photographerId },
      select: { name: true, upiId: true, bankCode: true, inboxAddress: true },
    }),
    db.bank.findMany({ select: { code: true, name: true }, orderBy: { name: "asc" } }),
  ]);
}

export function saveSettings(photographerId: string, input: {
  name: string; upiId: string; bankCode: string; inboxAddress: string;
}) {
  return db.photographer.update({
    where: { id: photographerId },
    data: input,
    select: { name: true, upiId: true, bankCode: true, inboxAddress: true },
  });
}

export function bankExists(bankCode: string) {
  return db.bank.findUnique({ where: { code: bankCode }, select: { code: true } });
}
