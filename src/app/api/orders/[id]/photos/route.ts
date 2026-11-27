import { NextResponse } from "next/server";
import * as photoService from "@/src/modules/photos/photo.service";

// Returns purchase links or resolves a signed link for one purchased photo.
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await context.params;
  const result = await photoService.getPaidPhotoLinks(orderId);
  if (!result)
    return NextResponse.json({ error: "Photos are available only for paid orders" }, { status: 403 });
  return NextResponse.json(result);
}
