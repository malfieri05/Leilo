import { googleServiceAccountConfigured } from "@/lib/sources/google/service-account";

/** SPINS Data — working exports and archives. */
const DEFAULT_SPINS_DATA = "1YQTeU98kn6_hbJYp9PfgUJ9fAlghcDse";
/** SPINS ARK DATA — curated sheets for Sales HQ sync. */
const DEFAULT_SPINS_ARK = "1Z6WRDMHUbf2m-FYM8sDZNsVux7Yz1zdJ";

export function spinsDriveFolderIds(): string[] {
  const list = process.env.GOOGLE_DRIVE_SPINS_FOLDER_IDS?.trim();
  if (list) {
    return [...new Set(list.split(/[,\s]+/).map((id) => id.trim()).filter(Boolean))];
  }
  const main = process.env.GOOGLE_DRIVE_SPINS_FOLDER_ID?.trim() || DEFAULT_SPINS_DATA;
  const ark = process.env.GOOGLE_DRIVE_SPINS_ARK_FOLDER_ID?.trim() || DEFAULT_SPINS_ARK;
  return [...new Set([main, ark])];
}

/** Primary folder link for Sources tooltip. */
export function spinsDriveFolderId() {
  return spinsDriveFolderIds()[0] ?? DEFAULT_SPINS_DATA;
}

export function spinsDriveLive() {
  return googleServiceAccountConfigured() && spinsDriveFolderIds().length > 0;
}

export function spinsApiLive() {
  return Boolean(process.env.SPINS_API_KEY?.trim() && process.env.SPINS_API_URL?.trim());
}

export function spinsSourceConfigured() {
  return spinsApiLive() || spinsDriveLive();
}