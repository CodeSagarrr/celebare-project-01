import { notFound } from "next/navigation";
import { PaymentStatus } from "@/src/components/PaymentStatus";
import { db } from "@/src/lib/db";
import { buildUpiLink, buildUpiQrDataUrl } from "@/src/lib/upi";

export const instant = false;

// Rebuilds checkout from the order ID so refresh does not lose payment details.
export default async function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await db.order.findUnique({ where: { id: orderId }, include: { photographer: { select: { name: true, upiId: true } } } });
  if (!order) notFound();
  const upiLink = buildUpiLink({ upiId: order.photographer.upiId, name: order.photographer.name, amountPaise: order.amountPaise, orderId });
  const qr = await buildUpiQrDataUrl(upiLink);
  return <main className="page-shell narrow">
    <a className="back-link" href="/">← Back to photos</a>
    <PaymentStatus initialOrder={{ orderId, status: order.status, amountPaise: order.amountPaise, expiresAt: order.expiresAt.toISOString(), upiLink, qr }} />
  </main>;
}
