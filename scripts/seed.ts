import "dotenv/config";
import { db } from "../src/shared/db";
import { hashPassword } from "../src/modules/auth/password";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { uploadEventPhotos } from "../src/modules/photos/photo.service";

const demoPhotographers = [
  {
    id: "photo-asha",
    name: "Asha Studio",
    email: "asha@example.test",
    password: "AshaDemo123!",
    upiId: "asha.studio@upi",
    bankCode: "DEMO_A",
    inboxAddress: "asha@photos.example.test",
    eventName: "Garden Wedding",
    pricePaise: 5000,
    assetFolder: "marathon",
    photos: ["photo-1552674605-db6ffd4facb5.avif", "photo-1571008887538-b36bb32f4571.avif", "photo-1590333748338-d629e4564ad9.avif", "photo-1777788613992-5f2655a97e72.avif", "premium_photo-1664297510120-354f5adbb9eb.avif"],
  },
  {
    id: "photo-rohan",
    name: "Rohan Frames",
    email: "rohan@example.test",
    password: "RohanDemo123!",
    upiId: "rohan.frames@upi",
    bankCode: "DEMO_B",
    inboxAddress: "rohan@photos.example.test",
    eventName: "Mehendi Evening",
    pricePaise: 7500,
    assetFolder: "navratri",
    photos: ["photo-1740767582319-d62dd779143f.avif", "photo-1772554699613-970ec79a2ad7.avif", "photo-1774160476944-1a226b0ef5bd.avif", "photo-1774160477116-ebaddecb399e.avif", "premium_photo-1664304095595-e428558e8161.avif"],
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
      update: {
        name: demo.name,
        email: demo.email,
        passwordHash: hashPassword(demo.password, demo.id),
        slug: demo.id,
      },
      create: {
        id: demo.id,
        name: demo.name,
        email: demo.email,
        passwordHash: hashPassword(demo.password, demo.id),
        slug: demo.id,
        upiId: demo.upiId,
        bankCode: demo.bankCode,
        inboxAddress: demo.inboxAddress,
      },
    });
    const event = await db.event.upsert({
      where: { id: `event-${demo.id}` },
      update: { name: demo.eventName, pricePaise: demo.pricePaise, slug: `event-${demo.id}` },
      create: {
        id: `event-${demo.id}`,
        photographerId: demo.id,
        name: demo.eventName,
        slug: `event-${demo.id}`,
        pricePaise: demo.pricePaise,
      },
    });
    const files = await Promise.all(demo.photos.map(async (name) => {
      const source = await readFile(join(process.cwd(), "seed-assets", demo.assetFolder, name));
      const webp = await sharp(source).webp({ quality: 90 }).toBuffer();
      return new File([new Uint8Array(webp)], `${name}.webp`, { type: "image/webp" });
    }));
    const uploaded = await uploadEventPhotos(event.id, demo.id, files, demo.photos);
    if ("error" in uploaded) throw new Error(uploaded.error);
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
