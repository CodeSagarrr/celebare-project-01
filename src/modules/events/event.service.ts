import { Prisma } from "@/src/app/generated/prisma/client";
import { z } from "zod";
import { createEventSchema } from "./event.schema";
import * as eventRepo from "./event.repo";
import { toEventResponse } from "./event.mapper";
import { nanoid } from "nanoid";

export async function createEvent(
  input: z.infer<typeof createEventSchema>,
  photographerId: string,
) {
  try {
    const event = await eventRepo.createEvent({
      ...input,
      photographerId,
      slug: `${input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${nanoid(6).toLowerCase()}`,
    });
    return { event: toEventResponse(event), status: 201 as const };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return { error: "Event already exists", status: 409 as const };
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    )
      return { error: "Photographer not found", status: 404 as const };
    throw error;
  }
}

export async function listPhotographerEvents(photographerId: string) {
  return (await eventRepo.listEvents(photographerId)).map(toEventResponse);
}
