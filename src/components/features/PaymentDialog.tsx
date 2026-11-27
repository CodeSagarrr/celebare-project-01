"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { PaymentStatus } from "@/src/components/PaymentStatus";
import type { OrderSnapshot, PaidPhotoLink } from "@/src/lib/api";
import { useCallback } from "react";

export function PaymentDialog({
  order,
  startAgainHref = "/",
  onClose,
  onPaidPhotos,
}: {
  order: OrderSnapshot;
  startAgainHref?: string;
  onClose?: () => void;
  onPaidPhotos?: (orderId: string, photos: PaidPhotoLink[]) => void;
}) {
  const router = useRouter();
  const notifyPaidPhotos = useCallback(
    (photos: PaidPhotoLink[]) => onPaidPhotos?.(order.orderId, photos),
    [onPaidPhotos, order.orderId],
  );
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
      <PaymentStatus initialOrder={order} startAgainHref={startAgainHref} onPaidPhotos={notifyPaidPhotos} />
    </DialogContent>
  </Dialog>;
}
