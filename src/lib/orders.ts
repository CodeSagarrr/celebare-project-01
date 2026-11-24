import { OrderStatus } from "../app/generated/prisma/enums";
import { db } from "./db";

// Finds an unused one-to-ninety-nine-paise suffix for a pending order.
export async function pickFreePaise(
  totalPaise: number,
  startSuffix = 1,
): Promise<number | null> {
  const now = new Date();
  const pendingAmounts = await db.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      expiresAt: { gt: now },
      amountPaise: { gt: totalPaise, lte: totalPaise + 99 },
    },
    select: { amountPaise: true },
  });
  const usedAmounts = new Set(pendingAmounts.map((order) => order.amountPaise));

  for (let suffix = startSuffix; suffix <= 99; suffix += 1) {
    const amountPaise = totalPaise + suffix;
    if (!usedAmounts.has(amountPaise)) return amountPaise;
  }
  return null;
}

// Reports expiry from server time so a stale database status cannot unlock an order.
export function getOrderStatus(
  status: OrderStatus,
  expiresAt: Date,
  now = new Date(),
): OrderStatus {
  if (status === OrderStatus.PENDING && now > expiresAt) return OrderStatus.EXPIRED;
  return status;
}
