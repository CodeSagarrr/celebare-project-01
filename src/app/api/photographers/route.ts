import { NextResponse } from "next/server";
import * as photographerService from "@/src/modules/photographers/photographer.service";

// Creates a photographer and returns the inbox address used for bank notices.
export async function POST(request: Request) {
  const result = await photographerService.registerPhotographer(
    await request.json().catch(() => null),
  );
  if ("error" in result)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.photographer, { status: result.status });
}

// Lists photographers so guests and the dashboard can choose a demo account.
export async function GET() {
  const photographers = await photographerService.listPhotographers();
  return NextResponse.json(photographers);
}
