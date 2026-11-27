"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { createOrder, getPhotoLinks, type OrderSnapshot, type PaidPhotoLink } from "@/src/lib/api";
import { selectedTotalPaise } from "@/src/modules/photographers/public-catalog";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { PaymentDialog } from "./PaymentDialog";
import type { PublicEvent } from "@/src/modules/photographers/public-catalog";
import { AnimatedTotal } from "./AnimatedTotal";

type GalleryEvent = Omit<PublicEvent, "photos"> & { photographer: { name: string }; photos: Array<{ id: string; previewUrl: string }> };

export function EventGallery({ event }: { event: GalleryEvent }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [checkout, setCheckout] = useState<OrderSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paidPhotos, setPaidPhotos] = useState<PaidPhotoLink[]>([]);
  const [reviewPhotoId, setReviewPhotoId] = useState<string | null>(null);
  const purchaseStorageKey = `framepay:paid-orders:${event.id}`;
  const totalPaise = selectedTotalPaise(event.pricePaise, selected.length);

  useEffect(() => {
    let active = true;
    try {
      const stored = JSON.parse(sessionStorage.getItem(purchaseStorageKey) ?? "[]") as unknown;
      const orderIds = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
      void Promise.all(orderIds.map((id) => getPhotoLinks(id).catch(() => []))).then((orders) => {
        if (active) {
          const eventPhotoIds = new Set(event.photos.map((photo) => photo.id));
          setPaidPhotos(orders.flat().filter((photo) => eventPhotoIds.has(photo.photoId)));
        }
      });
    } catch {
      // Browser storage may be disabled; purchases still work for this visit.
    }
    return () => { active = false; };
  }, [event.photos, purchaseStorageKey]);

  const rememberPaidPhotos = useCallback((orderId: string, photos: PaidPhotoLink[]) => {
    const eventPhotoIds = new Set(event.photos.map((photo) => photo.id));
    const galleryPurchases = photos.filter((photo) => eventPhotoIds.has(photo.photoId));
    setPaidPhotos((current) => Array.from(new Map(
      [...current, ...galleryPurchases].map((photo) => [photo.photoId, photo]),
    ).values()));
    setSelected((current) => current.filter((id) => !galleryPurchases.some((photo) => photo.photoId === id)));
    try {
      const stored = JSON.parse(sessionStorage.getItem(purchaseStorageKey) ?? "[]") as unknown;
      const previous = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
      sessionStorage.setItem(purchaseStorageKey, JSON.stringify([...new Set([...previous, orderId])]));
    } catch {
      // The current gallery state still unlocks the paid photos without storage.
    }
  }, [event.photos, purchaseStorageKey]);

  const photoToReview = event.photos.find((photo) => photo.id === reviewPhotoId);
  const reviewedPurchase = paidPhotos.find((photo) => photo.photoId === reviewPhotoId);

  useEffect(() => {
    const closeCheckout = () => setCheckout(null);
    window.addEventListener("popstate", closeCheckout);
    return () => window.removeEventListener("popstate", closeCheckout);
  }, []);

  function toggle(photoId: string) {
    setSelected((current) => current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId]);
  }

  async function beginCheckout() {
    setBusy(true);
    setError("");
    try {
      const order = await createOrder({ eventId: event.id, photoIds: selected });
      window.history.pushState(null, "", `/order/${order.orderId}`);
      setCheckout(order);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start checkout");
    } finally {
      setBusy(false);
    }
  }

  function closeCheckout(open: boolean) {
    if (open) return;
    setCheckout(null);
    if (window.location.pathname.startsWith("/order/")) window.history.back();
  }

  return <>
    <div className="gallery-intro"><p className="eyebrow">{event.photographer.name}</p><h1>{event.name}</h1><p className="muted">Choose the photos you want. Each one is ₹{(event.pricePaise / 100).toFixed(2)}.</p></div>
    {event.photos.length === 0 ? <Card className="empty-state">This gallery has no photos yet.</Card> :
      <div className="photo-grid">{event.photos.map((photo, index) => {
        const isSelected = selected.includes(photo.id);
        const purchase = paidPhotos.find((item) => item.photoId === photo.id);
        return <article className={`photo-choice ${isSelected ? "is-selected" : ""} ${purchase ? "is-purchased" : ""}`} key={photo.id}>
          <button className="photo-select" type="button" disabled={Boolean(purchase)} aria-pressed={isSelected} aria-label={`${isSelected ? "Deselect" : "Select"} photo ${index + 1}`} onClick={() => toggle(photo.id)}>
            <span className="photo-frame"><Image src={purchase?.viewUrl ?? photo.previewUrl} width={640} height={480} unoptimized alt={`${purchase ? "Purchased photo" : "Blurred preview"} ${index + 1}`} />{purchase ? <span className="photo-purchased">Purchased</span> : <span className="photo-lock"><LockKeyhole aria-hidden="true" size={18} /></span>}{isSelected && !purchase && <span className="photo-check"><Check aria-hidden="true" size={19} /></span>}</span>
            <span className="photo-caption">Photo {String(index + 1).padStart(2, "0")}</span>
          </button>
          <div className="photo-actions">
            <Button type="button" size="sm" variant="outline" onClick={() => setReviewPhotoId(photo.id)}>Review</Button>
            {purchase && <Button asChild size="sm" variant="secondary"><a href={purchase.downloadUrl}>Download</a></Button>}
          </div>
        </article>;
      })}</div>}
    {selected.length > 0 && <div className="checkout-bar"><div><span>{selected.length} selected · </span><strong><AnimatedTotal amountPaise={totalPaise} /></strong></div><Button disabled={busy} onClick={beginCheckout}>{busy ? "Preparing…" : "Pay securely"}</Button></div>}
    {error && <p role="alert" className="gallery-error">{error}</p>}
    {checkout && <PaymentDialog order={checkout} startAgainHref={`/e/${event.slug}`} onClose={() => closeCheckout(false)} onPaidPhotos={rememberPaidPhotos} />}
    <Dialog open={Boolean(photoToReview)} onOpenChange={(open) => { if (!open) setReviewPhotoId(null); }}>
      {photoToReview && <DialogContent className="gallery-review-dialog">
        <DialogHeader>
          <DialogTitle>Photo {String(event.photos.findIndex((photo) => photo.id === photoToReview.id) + 1).padStart(2, "0")}</DialogTitle>
          <DialogDescription>{reviewedPurchase ? "Your purchased photo." : "Review the watermarked, blurred preview before selecting."}</DialogDescription>
        </DialogHeader>
        <Image className="review-image" src={reviewedPurchase?.viewUrl ?? photoToReview.previewUrl} width={1200} height={900} unoptimized alt={reviewedPurchase ? "Purchased photo" : "Blurred photo preview"} />
        {reviewedPurchase && <Button asChild variant="secondary"><a href={reviewedPurchase.downloadUrl}>Download photo</a></Button>}
      </DialogContent>}
    </Dialog>
  </>;
}
