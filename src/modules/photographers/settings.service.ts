import { photographerSettingsSchema } from "./settings.schema";
import * as settingsRepo from "./settings.repo";

export const getSettings = settingsRepo.getSettings;

export async function saveSettings(photographerId: string, input: unknown) {
  const parsed = photographerSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid settings", status: 400 as const };
  if (!(await settingsRepo.bankExists(parsed.data.bankCode)))
    return { error: "Bank not found", status: 400 as const };
  try {
    return { settings: await settingsRepo.saveSettings(photographerId, parsed.data), status: 200 as const };
  } catch {
    return { error: "Settings could not be saved", status: 409 as const };
  }
}
