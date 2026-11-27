import { notFound } from "next/navigation";
import Link from "next/link";
import { PaymentDialog } from "@/src/components/features/PaymentDialog";
import { getCheckout } from "@/src/modules/orders/order.service";

export const instant = false;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const checkout = await getCheckout(id);
  if (!checkout) notFound();
  const snapshot = checkout.snapshot;
  return <main className="page-shell narrow">
    <Link className="brand" href="/">frame<span>pay</span></Link>
    <p className="muted">Your order checkout</p>
    <PaymentDialog order={{ ...snapshot, expiresAt: snapshot.expiresAt.toISOString() }} />
  </main>;
}
