"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Badge } from "@/src/components/ui/badge";
import { getOrder, getPhotoLinks, type OrderSnapshot } from "@/src/lib/api";
import { Countdown } from "./Countdown";
import Link from "next/link";

// Polls the server so paid photos appear after email matching or after refresh.
export function PaymentStatus({ initialOrder, startAgainHref = "/" }: { initialOrder: OrderSnapshot; startAgainHref?: string }) {
  const orderQuery = useQuery({
    queryKey: ["order", initialOrder.orderId],
    queryFn: () => getOrder(initialOrder.orderId),
    initialData: initialOrder,
    refetchInterval: (query) => query.state.data?.status === "PENDING" ? 2000 : false,
  });
  const order = orderQuery.data;
  const photosQuery = useQuery({
    queryKey: ["paid-photos", initialOrder.orderId],
    queryFn: () => getPhotoLinks(initialOrder.orderId),
    enabled: order.status === "PAID",
    staleTime: Infinity,
  });
  const photos = photosQuery.data ?? [];
  const message = orderQuery.error?.message ?? photosQuery.error?.message ?? "";

  const rupees = `${Math.floor(order.amountPaise / 100)}.${String(order.amountPaise % 100).padStart(2, "0")}`;
  return (
    <section className="card payment-card">
      <p className="eyebrow">UPI checkout</p>
      <h1>Pay ₹{rupees}</h1>
      {order.status === "PENDING" && <p className="muted">Scan the QR in your UPI app. This order expires in <Countdown expiresAt={order.expiresAt} />.</p>}
      {order.status === "PAID" && <p className="muted">Your payment is confirmed.</p>}
      {order.status === "PENDING" && <>
        <Image className="qr-code" src={order.qr} width={230} height={230} alt="UPI payment QR code" />
        <a className="button secondary" href={order.upiLink}>Open UPI app</a>
      </>}
      <Badge variant={order.status === "EXPIRED" ? "destructive" : "secondary"}>{order.status}</Badge>
      {order.status === "PENDING" && <p className="muted">Waiting for the bank email…</p>}
      {order.status === "EXPIRED" && <Link className="button" href={startAgainHref}>Start again</Link>}
      {message && <p role="alert">{message}</p>}
      {order.status === "PAID" && <div><h2>Your photos</h2>{photos.map((photo) => <p key={photo.photoId}><a href={photo.viewUrl}>View photo {photo.photoId.slice(0, 6)}</a> · <a href={photo.downloadUrl}>Download</a></p>)}</div>}
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
