import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/src/lib/db";

const eventInput = z.object({
  photographerId: z.string().min(1),
  name: z.string().trim().min(1),
  pricePaise: z.number().int().positive(),
});

// Creates an event with an integer paise price for each photo.
export async function POST(request: Request) {
  const parsed = eventInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  try {
    const event = await db.event.create({ data: parsed.data });
    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Photographer not found" },
      { status: 404 },
    );
  }
}

// Lists events belonging to the requested photographer only.
export async function GET(request: Request) {
  const photographerId = new URL(request.url).searchParams.get(
    "photographerId",
  );
  if (!photographerId)
    return NextResponse.json(
      { error: "photographerId is required" },
      { status: 400 },
    );
  const events = await db.event.findMany({
    where: { photographerId },
    include: { photos: { select: { id: true, storageKey: true } } },
  });
  return NextResponse.json(events);
}
