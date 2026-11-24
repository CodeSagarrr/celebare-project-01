import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/src/lib/db";

const photographerInput = z.object({
  name: z.string().trim().min(1),
  upiId: z.string().trim().min(3),
  bankCode: z.string().trim().min(1),
  inboxAddress: z.string().trim().email(),
});

// Creates a photographer and returns the inbox address used for bank notices.
export async function POST(request: Request) {
  const parsed = photographerInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const photographer = await db.photographer.create({
      data: { id: nanoid(), ...parsed.data },
      select: { id: true, name: true, inboxAddress: true },
    });
    return NextResponse.json(photographer, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Photographer already exists or bank is invalid" }, { status: 409 });
  }
}

// Lists photographers so guests and the dashboard can choose a demo account.
export async function GET() {
  const photographers = await db.photographer.findMany({
    select: { id: true, name: true, upiId: true, events: { select: { id: true, name: true, pricePaise: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(photographers);
}
