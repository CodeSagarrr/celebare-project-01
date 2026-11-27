import { notFound } from "next/navigation";
import { PaymentDialog } from "@/src/components/features/PaymentDialog";
import { getCheckout } from "@/src/modules/orders/order.service";
import Link from "next/link";
import { SiteHeader } from "@/src/components/features/site-header";

export const instant = false;

// Rebuilds checkout from the order ID so refresh does not lose payment details.
export default async function PayPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const checkout = await getCheckout(orderId);
  if (!checkout) notFound();
  return (
    <main className="page-shell narrow">
      <SiteHeader><Link href="/">
        ← Back to photos
      </Link></SiteHeader>
      <PaymentDialog
        order={{
          orderId,
          status: checkout.snapshot.status,
          amountPaise: checkout.snapshot.amountPaise,
          expiresAt: checkout.snapshot.expiresAt.toISOString(),
          upiLink: checkout.snapshot.upiLink,
          qr: checkout.snapshot.qr,
        }}
      />
    </main>
  );
}
