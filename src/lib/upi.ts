import QRCode from "qrcode";

// Builds the UPI URI that payment apps can open for this order.
export function buildUpiLink(input: {
  upiId: string;
  name: string;
  amountPaise: number;
  orderId: string;
}): string {
  const params = new URLSearchParams({
    pa: input.upiId,
    pn: input.name,
    am: `${Math.floor(input.amountPaise / 100)}.${String(input.amountPaise % 100).padStart(2, "0")}`,
    cu: "INR",
    tn: `Photo order ${input.orderId}`,
  });
  return `upi://pay?${params.toString()}`;
}

// Creates a scannable QR image for the checkout page.
export function buildUpiQrDataUrl(upiLink: string): Promise<string> {
  return QRCode.toDataURL(upiLink);
}
