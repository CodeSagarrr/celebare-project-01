import "dotenv/config";
import { dkimSign } from "mailauth/lib/dkim/sign";
import { nanoid } from "nanoid";
import { db } from "../src/lib/db";

const baseUrl = process.env.APP_URL ?? "http://localhost:3001";
const ingestSecret = process.env.INGEST_SECRET ?? "local-demo-secret";
const demoPrivateKey = `-----BEGIN PRIVATE KEY-----
MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAOJjLSlp+zRKMagi
KrV9B19M/GdNmp5mGenzDePsG/vDcc9+E2a6WBxSqsYwft1vXAvIpkDyXHX08Ia7
QG44wpYYVGi8/sKCt7A11B16MJ6s1BRa+AFg6GIAl6qdBoL+CSjETw3Zu9Lm/pux
+3oOQ9foHti98bfpmmgFridrni/NAgMBAAECgYEAlG7me5LrjBthd5X/XsO9g7Tc
gXcWe+kB8KzWXKzApFA/XQaS/fYMM3XYVt4RMGsFdQx4RXkjOowA8LXxxtMccUV+
+FT8JWOeChufve9aXeYbrKYq80YWUdtmpi4ywSr0oXnqZWxAYNfKE0H54JNxxQRP
b4Rfni+xX4vi72CjWYECQQD1YqZcJvUaxiSutGEQexa7lChEo690KfPaRgiMnMh+
4Od0QNZJnwacjQUMEN45OmYLf3v+YFi2IR07PaeH5NH9AkEA7C4logdXlsxAdqhu
Si3wghUkTfPMLm9uptumfdZjR0ywg83tE5xeVeOKQYLuNOSx/UqiOj2s8MZOIagQ
oIqWEQJAEdVwl8PxDlgWNGhBoawAc/OJlat7xeqCoXtzhZyjaa04xRctO76GAXyy
QDU9oVUgM3e5cDxaVipD8JlDgrnblQJAUq184xGq6dEqp98ibLlUPlVkVh2IVqEP
nT27NMX+DxGboShPW9QbefmjhndtJ/r/C+o6jCTXC5p/82xAFdMt4QJAHkc1GslI
//DWQPcm+MuN6hdPjcz9BuLaPo86rnW1KbQquaIJl0SS9doXAXZB7tfanSiY0Cg8
5f7X+ap5J6N03g==
-----END PRIVATE KEY-----`;

type DemoCase =
  | "success"
  | "fake-sender"
  | "duplicate"
  | "late"
  | "wrong-amount";
type DemoPhotographer = { id: string; inboxAddress: string; upiId: string };
type DemoOrder = { orderId: string; amountPaise: number; expiresAt: string };

// Reports HTML/404 responses clearly instead of exposing an unhelpful JSON parse error.
async function readJson<T>(response: Response, action: string): Promise<T> {
  const body = await response.text();
  try {
    const result = JSON.parse(body) as T;
    if (!response.ok) throw new Error(`${action} failed (${response.status}): ${body}`);
    return result;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `${action} expected JSON but got HTTP ${response.status} from ${response.url}. ` +
          `Check APP_URL and make sure npm run dev is running. Response: ${body.slice(0, 180)}`,
      );
    }
    throw error;
  }
}

// Creates a fresh order through the same API used by the guest flow.
async function createDemoOrder(photographerId: string): Promise<DemoOrder> {
  const eventsResponse = await fetch(
    `${baseUrl}/api/events?photographerId=${photographerId}`,
  );
  const events = await readJson<Array<{
    id: string;
    photos: Array<{ id: string }>;
  }>>(eventsResponse, "Loading demo events");
  const event = events[0];
  if (!event?.photos.length)
    throw new Error(
      `No seeded event/photos for ${photographerId}; run npm run seed`,
    );
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventId: event.id, photoIds: [event.photos[0].id] }),
  });
  return readJson<DemoOrder>(response, "Creating demo order");
}

// Formats integer paise exactly for bank email fixture text.
function formatRupees(amountPaise: number): string {
  return `${Math.floor(amountPaise / 100)}.${String(amountPaise % 100).padStart(2, "0")}`;
}

// Builds the raw message and signs trusted demo bank mail with the local test key.
async function makeEmail(input: {
  from: string;
  inboxAddress: string;
  receiverUpiId: string;
  bank: "a" | "b";
  amountPaise: number;
  utr: string;
  txnTime: Date;
  signed: boolean;
}): Promise<string> {
  const body =
    input.bank === "a"
      ? `Payment credited\nAmount: INR ${formatRupees(input.amountPaise)}\nUTR: ${input.utr}\nTransaction time: ${input.txnTime.toISOString()}\nTo: ${input.receiverUpiId}\nStatus: CREDITED`
      : `amount=${formatRupees(input.amountPaise)}; utr=${input.utr}; time=${input.txnTime.toISOString()}; to=${input.receiverUpiId}; result=credited`;
  const raw = [
    `From: Demo bank <${input.from}>`,
    `To: ${input.inboxAddress}`,
    "Subject: Demo bank credit notice",
    `Date: ${input.txnTime.toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
    "",
  ].join("\r\n");
  if (!input.signed) return raw;
  const result = await dkimSign(raw, {
    signatureData: [
      {
        signingDomain: "example.test",
        selector: "demo",
        privateKey: demoPrivateKey,
      },
    ],
  });
  if (!result.signatures) throw new Error("Could not sign demo bank email");
  return result.signatures + raw;
}

// Sends one raw email fixture through the secured ingest endpoint.
async function sendEmail(
  rawEmail: string,
  inboxAddress: string,
): Promise<string> {
  const response = await fetch(`${baseUrl}/api/ingest`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-secret": ingestSecret,
    },
    body: JSON.stringify({ rawEmail, to: inboxAddress }),
  });
  const result = await readJson<{
    accepted: boolean;
    paymentId?: string;
  }>(response, "Sending demo email");
  if (!result.accepted || !result.paymentId)
    throw new Error("Ingest did not save the email");
  return result.paymentId;
}

// Waits for the post-response verifier so each case can print its final status.
async function waitForPayment(paymentId: string): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      select: { status: true, reason: true },
    });
    if (payment && payment.reason !== "Processing") return payment.status;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Payment verification did not finish within ten seconds");
}

// Runs one named showcase case and reports both resulting statuses.
async function runCase(name: DemoCase): Promise<void> {
  const photographers = await db.photographer.findMany({
    where: { id: { in: ["photo-asha", "photo-rohan"] } },
    select: { id: true, inboxAddress: true, upiId: true },
  });
  const asha = photographers.find(
    (photographer) => photographer.id === "photo-asha",
  ) as DemoPhotographer | undefined;
  const rohan = photographers.find(
    (photographer) => photographer.id === "photo-rohan",
  ) as DemoPhotographer | undefined;
  if (!asha || !rohan)
    throw new Error("Run npm run seed first to create both demo photographers");

  const photographer =
    name === "duplicate" || name === "wrong-amount" ? rohan : asha;
  const bank: "a" | "b" = photographer.id === "photo-asha" ? "a" : "b";
  const order = await createDemoOrder(photographer.id);
  const utr = `DEMO${nanoid(12).toUpperCase()}`;
  const now = new Date();
  if (name === "late") {
    await db.order.update({
      where: { id: order.orderId },
      data: { expiresAt: new Date(now.getTime() - 6000) },
    });
  }

  const amountPaise =
    name === "wrong-amount" ? order.amountPaise + 1 : order.amountPaise;
  const from =
    name === "fake-sender"
      ? "fraud@unknown.example.test"
      : `alerts@bank-${bank}.example.test`;
  const rawEmail = await makeEmail({
    from,
    inboxAddress: photographer.inboxAddress,
    receiverUpiId: photographer.upiId,
    bank,
    amountPaise,
    utr,
    txnTime: name === "late" ? now : new Date(),
    signed: name !== "fake-sender",
  });

  let paymentStatus: string;
  if (name === "duplicate") {
    const firstPayment = await sendEmail(rawEmail, photographer.inboxAddress);
    await waitForPayment(firstPayment);
    const duplicatePayment = await sendEmail(
      rawEmail,
      photographer.inboxAddress,
    );
    paymentStatus = await waitForPayment(duplicatePayment);
  } else {
    const paymentId = await sendEmail(rawEmail, photographer.inboxAddress);
    paymentStatus = await waitForPayment(paymentId);
  }
  const updatedOrder = await db.order.findUnique({
    where: { id: order.orderId },
    select: { status: true },
  });
  const payments = await db.payment.findMany({
    where: { rawEmail },
    select: { status: true, reason: true },
  });
  console.log(
    JSON.stringify(
      {
        case: name,
        orderStatus: updatedOrder?.status,
        paymentStatus,
        payments,
      },
      null,
      2,
    ),
  );
}

// Validates the command line case name before running a demo request.
async function main(): Promise<void> {
  const name = process.argv[2] as DemoCase | undefined;
  const supported: DemoCase[] = [
    "success",
    "fake-sender",
    "duplicate",
    "late",
    "wrong-amount",
  ];
  if (!name || !supported.includes(name))
    throw new Error(`Usage: npm run demo -- ${supported.join("|")}`);
  try {
    await runCase(name);
  } finally {
    await db.$disconnect();
  }
}

void main();
