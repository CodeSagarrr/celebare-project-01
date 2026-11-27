import { NextResponse } from "next/server";
import { getPaidPhotoRedirect } from "@/src/modules/photos/photo.service";

export async function GET(_request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  const { id, photoId } = await context.params;
  const url = await getPaidPhotoRedirect(id, photoId, true);
  return url ? NextResponse.redirect(url) : NextResponse.json({ error: "Photo is unavailable" }, { status: 403 });
}
