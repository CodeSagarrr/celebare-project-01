"use client";

import { useEffect, useState } from "react";
import { Check, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { createOrder, type OrderSnapshot } from "@/src/lib/api";
import { selectedTotalPaise } from "@/src/modules/photographers/public-catalog";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { PaymentDialog } from "./PaymentDialog";
import type { PublicEvent } from "@/src/modules/photographers/public-catalog";
import { AnimatedTotal } from "./AnimatedTotal";

type GalleryEvent = Omit<PublicEvent, "photos"> & { photographer: { name: string }; photos: Array<{ id: string; previewUrl: string }> };

export function EventGallery({ event }: { event: GalleryEvent }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [checkout, setCheckout] = useState<OrderSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const totalPaise = selectedTotalPaise(event.pricePaise, selected.length);

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
        return <button className={`photo-choice ${isSelected ? "is-selected" : ""}`} type="button" key={photo.id} aria-pressed={isSelected} aria-label={`${isSelected ? "Deselect" : "Select"} photo ${index + 1}`} onClick={() => toggle(photo.id)}>
          <span className="photo-frame"><Image src={photo.previewUrl} width={640} height={480} unoptimized alt={`Blurred preview ${index + 1}`} /><span className="photo-lock"><LockKeyhole aria-hidden="true" size={18} /></span>{isSelected && <span className="photo-check"><Check aria-hidden="true" size={19} /></span>}</span>
          <span className="photo-caption">Photo {String(index + 1).padStart(2, "0")}</span>
        </button>;
      })}</div>}
    {selected.length > 0 && <div className="checkout-bar"><div><span>{selected.length} selected · </span><strong><AnimatedTotal amountPaise={totalPaise} /></strong></div><Button disabled={busy} onClick={beginCheckout}>{busy ? "Preparing…" : "Pay securely"}</Button></div>}
    {error && <p role="alert" className="gallery-error">{error}</p>}
    {checkout && <PaymentDialog order={checkout} startAgainHref={`/e/${event.slug}`} onClose={() => closeCheckout(false)} />}
  </>;
}
