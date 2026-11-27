import { notFound } from "next/navigation";
import Link from "next/link";
import { PaymentDialog } from "@/src/components/features/PaymentDialog";
import { getCheckout } from "@/src/modules/orders/order.service";
import { SiteHeader } from "@/src/components/features/site-header";

export const instant = false;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const checkout = await getCheckout(id);
  if (!checkout) notFound();
  const snapshot = checkout.snapshot;
  return <main className="page-shell narrow">
    <SiteHeader><Link href="/">Back to galleries</Link></SiteHeader>
    <p className="muted">Your order checkout</p>
    <PaymentDialog order={{ ...snapshot, expiresAt: snapshot.expiresAt.toISOString() }} />
  </main>;
}
