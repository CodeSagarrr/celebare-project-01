import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { uploadEventPhotos } from "@/src/modules/photos/photo.service";
import { StorageError } from "@/src/modules/photos/storage";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const photographerId = session?.user.photographerId;
  if (!photographerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: eventId } = await context.params;
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid multipart form" }, { status: 400 });
  const files = form.getAll("files").filter((value): value is File => value instanceof File);
  let result;
  try { result = await uploadEventPhotos(eventId, photographerId, files); }
  catch (error) {
    if (error instanceof StorageError) return NextResponse.json({ error: error.message }, { status: 502 });
    return NextResponse.json({ error: "Photo upload failed" }, { status: 500 });
  }
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ photos: result.photos }, { status: result.status });
}
