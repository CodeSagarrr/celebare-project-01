import { getOrder, getPhotoLinks, type OrderSnapshot } from "@/src/lib/api";

type PollDependencies = {
  readOrder: typeof getOrder;
  readPhotos: typeof getPhotoLinks;
  schedule: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel: (timer: ReturnType<typeof setTimeout>) => void;
};

const browserDependencies: PollDependencies = {
  readOrder: getOrder,
  readPhotos: getPhotoLinks,
  schedule: (callback, delay) => globalThis.setTimeout(callback, delay),
  cancel: (timer) => globalThis.clearTimeout(timer),
};

// Reads immediately so a recently confirmed payment is visible without waiting for the first interval.
export function startPaymentPolling(
  orderId: string,
  onOrder: (order: OrderSnapshot) => void,
  onPhotos: (photos: Awaited<ReturnType<typeof getPhotoLinks>>) => void,
  onError: (error: unknown) => void,
  dependencies: PollDependencies = browserDependencies,
): () => void {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function poll(): Promise<void> {
    try {
      const order = await dependencies.readOrder(orderId);
      if (!active) return;
      onOrder(order);
      if (order.status === "PAID") {
        onPhotos(await dependencies.readPhotos(orderId));
        return;
      }
      if (order.status === "EXPIRED") return;
    } catch (error) {
      if (active) onError(error);
    }
    if (active) timer = dependencies.schedule(() => void poll(), 2000);
  }

  void poll();
  return () => {
    active = false;
    if (timer) dependencies.cancel(timer);
  };
}
