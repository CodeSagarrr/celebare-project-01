import "dotenv/config";
import { db } from "../src/lib/db";

const demoPhotographers = [
  {
    id: "photo-asha",
    name: "Asha Studio",
    upiId: "asha.studio@upi",
    bankCode: "DEMO_A",
    inboxAddress: "asha@photos.example.test",
    eventName: "Garden Wedding",
    pricePaise: 5000,
    photos: ["garden-01.jpg", "garden-02.jpg", "garden-03.jpg"],
  },
  {
    id: "photo-rohan",
    name: "Rohan Frames",
    upiId: "rohan.frames@upi",
    bankCode: "DEMO_B",
    inboxAddress: "rohan@photos.example.test",
    eventName: "Mehendi Evening",
    pricePaise: 7500,
    photos: ["mehendi-01.jpg", "mehendi-02.jpg", "mehendi-03.jpg"],
  },
];

// Seeds the two isolated demo photographers, banks, events, and sample photos.
async function seed(): Promise<void> {
  await db.bank.upsert({
    where: { code: "DEMO_A" },
    update: {},
    create: {
      code: "DEMO_A",
      name: "Demo Bank A",
      senderDomain: "bank-a.example.test",
      parserKey: "fakebank-a",
    },
  });
  await db.bank.upsert({
    where: { code: "DEMO_B" },
    update: {},
    create: {
      code: "DEMO_B",
      name: "Demo Bank B",
      senderDomain: "bank-b.example.test",
      parserKey: "fakebank-b",
    },
  });

  for (const demo of demoPhotographers) {
    await db.photographer.upsert({
      where: { id: demo.id },
      update: {},
      create: {
        id: demo.id,
        name: demo.name,
        upiId: demo.upiId,
        bankCode: demo.bankCode,
        inboxAddress: demo.inboxAddress,
      },
    });
    const event = await db.event.upsert({
      where: { id: `event-${demo.id}` },
      update: { name: demo.eventName, pricePaise: demo.pricePaise },
      create: {
        id: `event-${demo.id}`,
        photographerId: demo.id,
        name: demo.eventName,
        pricePaise: demo.pricePaise,
      },
    });
    for (const [index, storageKey] of demo.photos.entries()) {
      await db.photo.upsert({
        where: { id: `photo-${demo.id}-${index + 1}` },
        update: { eventId: event.id, storageKey },
        create: { id: `photo-${demo.id}-${index + 1}`, eventId: event.id, storageKey },
      });
    }
  }
}

// Closes the database pool after seeding completes or fails.
async function main(): Promise<void> {
  try {
    await seed();
  } finally {
    await db.$disconnect();
  }
}

void main();
