import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { db } from "@/src/shared/db";

export async function POST(request: Request) {
  const session = await auth();
  const photographerId = session?.user.photographerId;
  if (!photographerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const photographer = await db.photographer.findUnique({
    where: { id: photographerId }, select: { inboxAddress: true },
  });
  if (!photographer) return NextResponse.json({ error: "Photographer not found" }, { status: 404 });
  const secret = process.env.INGEST_SECRET;
  if (!secret) return NextResponse.json({ error: "Ingest is not configured" }, { status: 503 });
  const response = await fetch(new URL("/api/ingest", request.url), {
    method: "POST",
    headers: { "content-type": "application/json", "x-ingest-secret": secret },
    body: JSON.stringify({
      to: photographer.inboxAddress,
      rawEmail: `From: Framepay Test <test@framepay.local>\r\nTo: ${photographer.inboxAddress}\r\nSubject: Inbox test\r\n\r\nPhotographer inbox test message.`,
    }),
  });
  if (!response.ok) return NextResponse.json({ error: "Test message was not accepted" }, { status: 502 });
  return NextResponse.json({ sentTo: photographer.inboxAddress, accepted: true });
}
