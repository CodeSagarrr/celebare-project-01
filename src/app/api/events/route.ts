import { NextResponse } from "next/server";
import * as eventService from "@/src/modules/events/event.service";
import { auth } from "@/src/auth";
import { createEventSchema } from "@/src/modules/events/event.schema";
import { Prisma } from "@/src/app/generated/prisma/client";

// Creates an event with an integer paise price for each photo.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user.photographerId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  let result;
  try { result = await eventService.createEvent(parsed.data, session.user.photographerId); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return NextResponse.json({ error: "Event already exists" }, { status: 409 });
    return NextResponse.json({ error: "Could not create event" }, { status: 500 });
  }
  if ("error" in result)
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  return NextResponse.json(result.event, { status: result.status });
}

// Lists events belonging to the requested photographer only.
export async function GET(request: Request) {
  void request;
  const session = await auth();
  if (!session?.user.photographerId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const events = await eventService.listPhotographerEvents(
    session.user.photographerId,
  );
  return NextResponse.json(events);
}
