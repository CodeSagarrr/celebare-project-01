"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { PaymentStatus } from "@/src/components/PaymentStatus";
import type { OrderSnapshot } from "@/src/lib/api";

export function PaymentDialog({
  order,
  startAgainHref = "/",
  onClose,
}: {
  order: OrderSnapshot;
  startAgainHref?: string;
  onClose?: () => void;
}) {
  const router = useRouter();
  function changeOpen(open: boolean) {
    if (open) return;
    if (onClose) onClose();
    else router.push(startAgainHref);
  }

  return <Dialog open onOpenChange={changeOpen}>
    <DialogContent className="checkout-dialog">
      <DialogHeader>
        <DialogTitle>Order checkout</DialogTitle>
        <DialogDescription>Payment status updates automatically.</DialogDescription>
      </DialogHeader>
      <PaymentStatus initialOrder={order} startAgainHref={startAgainHref} />
    </DialogContent>
  </Dialog>;
}
