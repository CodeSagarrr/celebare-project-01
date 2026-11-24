export type OrderSnapshot = {
  orderId: string;
  status: "PENDING" | "PAID" | "EXPIRED";
  amountPaise: number;
  expiresAt: string;
  upiLink: string;
  qr: string;
};

// Loads the current server-owned order state for checkout polling.
export async function getOrder(orderId: string): Promise<OrderSnapshot> {
  const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load order status");
  return response.json() as Promise<OrderSnapshot>;
}

// Requests signed photo links after the server confirms the order is paid.
export async function getPhotoLinks(orderId: string): Promise<Array<{ photoId: string; url: string }>> {
  const response = await fetch(`/api/orders/${orderId}/photos`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load paid photos");
  const result = await response.json() as { photos: Array<{ photoId: string; url: string }> };
  return result.photos;
}
