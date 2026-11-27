import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import * as settingsService from "@/src/modules/photographers/settings.service";

export async function GET() {
  const session = await auth();
  if (!session?.user.photographerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [settings, banks] = await settingsService.getSettings(session.user.photographerId);
  return NextResponse.json({ settings, banks });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user.photographerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await settingsService.saveSettings(
    session.user.photographerId,
    await request.json().catch(() => null),
  );
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.settings, { status: result.status });
}
