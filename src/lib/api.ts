export type OrderSnapshot = {
  orderId: string;
  status: "PENDING" | "PAID" | "EXPIRED";
  amountPaise: number;
  expiresAt: string;
  upiLink: string;
  qr: string;
};

export type PaidPhotoLink = { photoId: string; viewUrl: string; downloadUrl: string };

export async function createOrder(input: { eventId: string; photoIds: string[] }): Promise<OrderSnapshot> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = await response.json() as OrderSnapshot & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Could not create order");
  return { ...result, expiresAt: new Date(result.expiresAt).toISOString(), status: "PENDING" };
}

// Loads the current server-owned order state for checkout polling.
export async function getOrder(orderId: string): Promise<OrderSnapshot> {
  const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load order status");
  return response.json() as Promise<OrderSnapshot>;
}

// Requests paid-photo view and download links after the order is confirmed.
export async function getPhotoLinks(
  orderId: string,
): Promise<PaidPhotoLink[]> {
  const response = await fetch(`/api/orders/${orderId}/photos`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not load paid photos");
  const result = (await response.json()) as {
    photos: PaidPhotoLink[];
  };
  return result.photos;
}
