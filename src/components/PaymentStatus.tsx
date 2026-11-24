"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrder, getPhotoLinks, type OrderSnapshot } from "@/src/lib/api";
import { Countdown } from "./Countdown";

// Polls the server so paid photos appear after email matching or after refresh.
export function PaymentStatus({ initialOrder }: { initialOrder: OrderSnapshot }) {
  const [order, setOrder] = useState(initialOrder);
  const [photos, setPhotos] = useState<Array<{ photoId: string; url: string }>>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    let polling = false;
    // Refreshes the authoritative status and links every two seconds.
    const timer = window.setInterval(async () => {
      if (polling) return;
      polling = true;
      try {
        const nextOrder = await getOrder(initialOrder.orderId);
        if (active) setOrder(nextOrder);
        if (nextOrder.status === "PAID" && active) setPhotos(await getPhotoLinks(initialOrder.orderId));
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Status check failed");
      } finally {
        polling = false;
      }
    }, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [initialOrder.orderId]);

  const rupees = `${Math.floor(order.amountPaise / 100)}.${String(order.amountPaise % 100).padStart(2, "0")}`;
  return (
    <section className="card payment-card">
      <p className="eyebrow">UPI checkout</p>
      <h1>Pay ₹{rupees}</h1>
      <p className="muted">Scan the QR in your UPI app. This order expires in <Countdown expiresAt={order.expiresAt} />.</p>
      <img className="qr-code" src={order.qr} alt="UPI payment QR code" />
      <a className="button secondary" href={order.upiLink}>Open UPI app</a>
      <p className={`status status-${order.status.toLowerCase()}`}>{order.status}</p>
      {order.status === "PENDING" && <p className="muted">Waiting for the bank email…</p>}
      {order.status === "EXPIRED" && <p>Expired, start again.</p>}
      {message && <p role="alert">{message}</p>}
      {order.status === "PAID" && <div><h2>Your photos</h2>{photos.map((photo) => <p key={photo.photoId}><a href={photo.url}>Open photo {photo.photoId.slice(0, 6)}</a></p>)}</div>}
    </section>
  );
}

// Refreshes server-rendered dashboard tables so new payment outcomes appear promptly.
export function DashboardRefresh() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 3000);
    return () => window.clearInterval(timer);
  }, [router]);

  return null;
}
