import "dotenv/config";
import { db } from "../src/shared/db";
import { simulatePayment } from "../src/modules/ingest/demo-simulator.service";

type DemoCase =
  | "success"
  | "fake-sender"
  | "duplicate"
  | "late"
  | "wrong-amount"
  | "wrong-receiver";

async function runCase(demoCase: DemoCase) {
  const photographerId = ["duplicate", "wrong-amount", "wrong-receiver"].includes(demoCase)
    ? "photo-rohan"
    : "photo-asha";
  const result = await simulatePayment(photographerId, demoCase);
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  const demoCase = process.argv[2] as DemoCase | undefined;
  const supported: DemoCase[] = [
    "success",
    "fake-sender",
    "duplicate",
    "late",
    "wrong-amount",
    "wrong-receiver",
  ];
  if (!demoCase || !supported.includes(demoCase))
    throw new Error("Usage: npm run demo -- " + supported.join("|"));
  try {
    await runCase(demoCase);
  } finally {
    await db.$disconnect();
  }
}

void main();
